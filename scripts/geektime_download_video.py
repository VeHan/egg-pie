#!/usr/bin/python
import re
import os
from os import listdir
from os.path import isfile

if __name__ == '__main__':
    file_names = os.listdir('.')
    file_names = filter(lambda file_name:isfile(file_name), file_names)
    visited = set()
    for file_name in file_names:
        if file_name[-3:] == 'mp4':
            visited.add(file_name[:-4])
    for file_name in file_names:
        if file_name[-4:] != 'html':
            continue
        with open(file_name) as f:
            data = f.read()
            m = re.search(r'loadSource\("(.*)?"\);', data)
            if not m:
                continue
            url = m.group(1)
            if not file_name.split()[0] in visited:
                os.system('ffmpeg -i {url} -c copy {file_name}.mp4'.format(url=url, file_name=file_name.split()[0]))
                os.rename('{file_name}.mp4'.format(file_name=file_name.split()[0]), '{file_name}.mp4'.format(file_name=file_name.split('.')[0]))