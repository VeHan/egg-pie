#!/usr/bin/python
# coding:utf-8

import re
import os
from os import listdir
from os.path import isfile
import requests
import subprocess

def download(src, dir):
    try:
        data = requests.get(src, timeout=10)
    except requests.exceptions.ConnectionError:
        print('download err: {0}'.format(url))
    fp = open(dir, 'wb')
    fp.write(data.content)
    fp.close()

if __name__ == '__main__':
#    file_names = subprocess.check_output('ls').split('\n')
    file_names = os.listdir('.')
    file_names = filter(lambda file_name:isfile(file_name), file_names)
    visited = set()
    for file_name in file_names:
        if file_name[-3:] == 'mp3':
            visited.add(file_name[:-4])
    for file_name in file_names:
        if file_name[-4:] != 'html':
            continue
        with open(file_name) as f:
            data = f.read()
            m = re.search(r'<audio.*?src=\"(.*)\" .*</audio>', data)
            if not m:
                continue
            url = m.group(1)
            if not file_name.split()[0] in visited:
                download(url, '{file_name}.mp3'.format(file_name=file_name.split('.')[0]))
