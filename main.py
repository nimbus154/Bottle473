from bottle import run, debug

import base
import users
import schedules
import departments
import users
import app

DEBUG = True

debug(DEBUG)
run(host='localhost', port=8080, reloader=DEBUG)
