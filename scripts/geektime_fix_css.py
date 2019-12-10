# coding=utf-8

from __future__ import absolute_import

__author__ = "hanweiwei"
__date__ = "2019-12-09"

"""
修复CSS样式
"""

def visit(arg, dir, files):
    for f in files:
        fp = open("%s/%s" % (dir, f), "r")
        text = fp.read()
        fp.close()

        fp = open("%s/%s" % (dir, f), "w")
        text = text.replace("fade-enter", "").replace("fade-enter-active", "")
        fp.write(text)
        fp.close()


if __name__ == '__main__':
    import os
    # 要修复的文件夹
    path = "/Users/hanweiwei/Downloads/Spring Boot与Kubernetes云原生微服务实践（完结）"
    os.path.walk(path, visit, ())
