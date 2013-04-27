from bottle import get, route, request, post

import bottle
 
@route('/register')
def register():
    return 'register json stuff'
