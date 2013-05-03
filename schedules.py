#!/usr/bin/env python
from bottle import get, post, put, request, response, HTTPResponse
from bottle import install, run

from bottle_mongo import MongoPlugin
from bson.objectid import ObjectId

# from pprint import pprint

install(MongoPlugin(uri='localhost', db='473', json_mongo=True))

secret_key = 84252450

@post('/users/:username/schedules')
def new_schedule(username, mongodb):
    session_user = request.get_cookie('sessions', secret=secret_key)
    if session_user:    # Do your thing, man
        # Mongo cursor with single document containing only _id
        user = mongodb.users.find_one({'username': username}, {'_id': 1, 'session_id': 1})
        # Create new schedule with user: ObjectId() of :username
        sid = mongodb.schedules.insert({'user': user['_id']})
        # Set response headers
        response.content_type = 'application/json'
        response.status = 201
        response.location = '/users/%s/schedules/%s' % (username, str(sid))
        return
    else:   # Access denied
        return HTTPResponse(status=401, output="Yeah, if you could log in, that'd be great.")

@put('/users/:username/schedules/:sid')
def update_schedule(username, sid, mongodb):
    # Check session cookie. Returns username if matched; otherwise, None.
    session_user = request.get_cookie('sessions', secret=secret_key)
    if session_user:    # Do your thing, man.
        mongodb.schedules.update({'_id': ObjectId(sid)},
                                 {'$set': request.json})
        response.status = 204
        response.location = '/users/%s/schedules/%s' % (username, sid)
        return
    else:   # Access Denied
        return HTTPResponse(status=401, output="Yeah, if you could log in, that'd be great")

@get('/users/:username/schedules/:sid')
def get_schedule(username, sid, mongodb):
    return mongodb.schedules.find_one({'_id': ObjectId(sid)})

run(host='0.0.0.0', port=8080, debug=True, reloader=True)
