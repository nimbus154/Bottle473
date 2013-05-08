from bottle import get

import base

@get('/')
def welcome():
    return base.server_static('welcome.html')

@get('/planner')
def start_app():
   return base.server_static('app.html') 
