"""Bounded local LRC / Apple-style absolute-time TTML parsing. No network."""
import math
import re
import xml.etree.ElementTree as ET

MAX_BYTES = 1_048_576
STAMP = r'(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?'

def clock(value):
    value = str(value).strip()
    try:
        if value.endswith('ms'):
            result = float(value[:-2]) / 1000
        elif value.endswith('s'):
            result = float(value[:-1])
        elif ':' in value:
            parts = value.split(':')
            if len(parts) not in (2, 3):
                raise ValueError()
            result = sum(float(p) * 60**i for i, p in enumerate(reversed(parts)))
        else:
            result = float(value)
        if not math.isfinite(result) or not 0 <= result <= 86400:
            raise ValueError()
        return result
    except (ValueError, TypeError):
        raise ValueError('Unsupported lyric timestamp. Use seconds or MM:SS / HH:MM:SS clock times.')

def stamp(match):
    return int(match[1])*60 + int(match[2]) + int((match[3] or '0').ljust(3, '0'))/1000

def parse_lrc(text):
    lines = []
    offset = re.search(r'\[offset:([+-]?\d+)\]', text, re.I)
    offset = max(-600, min(600, int(offset[1])/1000)) if offset else 0
    for raw in text.splitlines():
        times = list(re.finditer(r'\['+STAMP+r'\]', raw))
        if not times:
            continue
        content = raw[times[-1].end():]
        marks = list(re.finditer(r'<'+STAMP+r'>', content))
        for tag in times:
            start = stamp(tag) - offset
            words = []
            if marks:
                shift = stamp(tag) - stamp(times[0]) - offset
                prefix = content[:marks[0].start()]
                if prefix.strip():
                    # Untimed text is kept plain, not assigned invented word timing.
                    words.append({'text': prefix, 'start': None, 'end': None})
                for i, mark in enumerate(marks):
                    part = content[mark.end():marks[i+1].start() if i+1<len(marks) else len(content)]
                    if part:
                        words.append({'text': part, 'start': stamp(mark)+shift,
                                      'end': stamp(marks[i+1])+shift if i+1<len(marks) else None})
            title = re.sub(r'<'+STAMP+r'>', '', content).strip()
            lines.append({'start': start, 'end': None, 'text': title, 'words': words})
    return lines

def parse_ttml(text):
    if re.search(r'<!\s*(DOCTYPE|ENTITY)', text, re.I):
        raise ValueError('DTD and entity declarations are not supported in lyric files.')
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        raise ValueError('This TTML file is not valid XML.')
    stack = [(root, 0)]
    while stack:
        node, depth = stack.pop()
        if depth > 32:
            raise ValueError('This TTML file is nested too deeply.')
        stack.extend((child, depth+1) for child in node)
    elements = list(root.iter())
    if len(elements) > 30000:
        raise ValueError('This lyric file contains too many elements.')
    local = lambda node: node.tag.rsplit('}', 1)[-1]
    def role(node):
        return next((v for k, v in node.attrib.items() if k.rsplit('}',1)[-1]=='role'), '')
    def text_of(node):
        result = node.text or ''
        for child in node:
            if role(child) not in ('x-translation', 'x-roman'):
                result += text_of(child)
            result += child.tail or ''
        return result
    lines = []
    for p in elements:
        if local(p) != 'p':
            continue
        words = []
        def visit(node, inherited=False):
            if role(node) in ('x-translation','x-roman'):
                return
            if local(node)=='span' and 'begin' in node.attrib and not any('begin' in c.attrib for c in node):
                start=clock(node.attrib['begin'])
                end=clock(node.attrib['end']) if 'end' in node.attrib else start+clock(node.attrib['dur']) if 'dur' in node.attrib else None
                words.append({'text': text_of(node), 'start': start, 'end': end})
                if node.tail and words:
                    words[-1]['text'] += node.tail
                return
            for child in node:
                visit(child)
        visit(p)
        if 'begin' not in p.attrib and not words:
            continue
        start=clock(p.attrib['begin']) if 'begin' in p.attrib else min(w['start'] for w in words)
        end=clock(p.attrib['end']) if 'end' in p.attrib else start+clock(p.attrib['dur']) if 'dur' in p.attrib else None
        # Apple/AMLL TTML uses absolute timestamps on both lines and words.
        if any(w['start'] < start-.001 for w in words):
            raise ValueError('Use Apple/AMLL-style TTML with absolute line and word timestamps.')
        plain = text_of(p).strip()
        if words:
            prefix = p.text or ''
            if prefix.strip():
                words.insert(0, {'text':prefix,'start':None,'end':None})
            for w in words:
                w['text'] = re.sub(r'\s+', ' ', w['text'])
        lines.append({'start':start,'end':end,'text':re.sub(r'\s+',' ',plain),'words':words})
    return lines

def parse_lyrics(text, filename, duration=0):
    if not isinstance(text, str) or len(text.encode('utf-8')) > MAX_BYTES:
        raise ValueError('Choose a lyric file smaller than 1 MB.')
    extension = filename.rsplit('.',1)[-1].lower()
    if extension not in ('lrc','ttml','txt'):
        raise ValueError('Choose a .lrc, .ttml, or plain .txt lyric file.')
    if extension == 'txt':
        rows=text.lstrip('\ufeff').splitlines()
        if len(rows)>5000:
            raise ValueError('This lyric file contains too many lines.')
        if not any(row.strip() for row in rows):
            raise ValueError('This lyric file is empty.')
        return {'lines':[{'start':None,'end':None,'text':row.strip(),'words':[]} for row in rows], 'timing':'plain', 'source':filename}
    lines = parse_ttml(text.lstrip('\ufeff')) if extension=='ttml' else parse_lrc(text.lstrip('\ufeff'))
    if not lines:
        raise ValueError('No timed lyrics found. Choose timestamped LRC or TTML.')
    if len(lines)>5000 or sum(len(l['words']) for l in lines)>20000:
        raise ValueError('This lyric file contains too many lines or words.')
    lines.sort(key=lambda l:l['start'])
    for i,line in enumerate(lines):
        start=line['start']
        next_start=next((l['start'] for l in lines[i+1:] if l['start']>start),None)
        if line['end'] is None:
            line['end']=next_start if next_start is not None else duration if duration > start else start+8
        if line['end']<=start:
            raise ValueError('A lyric line ends before it starts.')
        for j,word in enumerate(line['words']):
            if word['start'] is None:
                continue
            if word['end'] is None:
                word['end']=next((w['start'] for w in line['words'][j+1:] if w['start'] is not None),line['end'])
            if word['end']<word['start'] or word['start']<start-.001 or word['end']>line['end']+.001:
                raise ValueError('A word timestamp falls outside its lyric line.')
        line['start']=max(0,start)
        line['end']=max(line['start'],line['end'])
        # Preserve blank entries as instrumental boundaries without displaying a fake line.
    return {'lines':lines,'timing':'word' if any(w['start'] is not None for l in lines for w in l['words']) else 'line','source':filename}
