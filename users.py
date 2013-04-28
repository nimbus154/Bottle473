from bottle import get, route, request, post, template, redirect

from models import Users

import bottle

import hashlib

import os
import json
filepath = os.getcwd()

bottle.TEMPLATE_PATH.insert(0, filepath + '/static/templates/')

@route('/')
@route('/users')
def register():
    userList = (Users.objects)
    return template('users.tpl', rows=userList)
 
@route('/register')
def register():
    return template('register.tpl')
    
@route('/register', method='POST')
def register_post():
    newUser = Users()
    newUser.username = request.forms.get('user', '').strip()
    newUser.password = request.forms.get('pass', '').strip()
    newUser.save()   
    redirect("/")

@route('/login')
def register():
    return template('login.tpl')
    
@route('/login', method='POST')
def register_post():
    
    username = request.forms.get('user', '').strip()
    password = request.forms.get('pass', '').strip()
    
    
    newUser = Users.objects(username = username)


    return 'Your password is %s' % newUser[0].password
