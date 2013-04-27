from bottle import run, debug

import base
import users

DEBUG = True

debug(DEBUG)
run(host='localhost', port=8080, reloader=DEBUG)
