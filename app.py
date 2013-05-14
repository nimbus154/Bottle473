from bottle import get

import base

@get('/')
def welcome():
    return base.server_static('login.html')

@get('/app')
def start_app():
   return base.server_static('app.html') 
