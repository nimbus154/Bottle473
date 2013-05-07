#!/usr/bin/env python
from bottle import get, post, put, request, response, HTTPResponse
from bottle import install, run

from bottle_mongo import MongoPlugin
from bson.objectid import ObjectId

import validictory

install(MongoPlugin(uri='localhost', db='mydatabase', json_mongo=True))

secret_key = 84252450
semesters = ['SPRING', 'SUMMER', 'FALL', 'WINTER']
# Schema for json Schedule object
schedule_schema = {
    'type': 'object',
    'properties': {
        'semester': {'type': 'string','enum': semesters, 'required': False},
        'year': {'type': 'integer', 'required': False},
        'user_id': {'type': 'any', 'required': False},
        'courses': {
            'type': 'array',
            'items': [
                {
                    'type': 'object',
                    'properties': {
                        'name': {'type': 'string'},
                        'number': {'type': 'integer'},
                        'dept': {'type': 'string'},
                        'description': {'type': 'string'},
                    },
                },
            ],
            'additionalItems': True,
            'required': False
        }
    }
}

@post('/api/users/:username/schedules')
def new_schedule(username, mongodb):
    '''
    Input: json empty document {}
    Output: Response 201 Created and Location with new _id

    Checks for valid user session. If the session checks out, a new schedule
    document is made. The resulting id is passed in the location header.
    Status 201 is created. If the session is not valid, status 401 Unauthorized
    is returned.
    '''
    session_user = request.get_cookie('sessions', secret=secret_key)
    if session_user:    # Do your thing, man
        # Mongo cursor with single document containing only _id
        user = mongodb.users.find_one({'username': username}, {'_id': 1})
        # Create new schedule with user: ObjectId() of :username
        sid = mongodb.schedules.insert({'user_id': user['_id']})
        # Set response headers
        response.content_type = 'application/json'
        response.status = 201
        response.headers['location'] = '/api/users/%s/schedules/%s' % (username, str(sid))
        return
    else:   # Access denied
        return HTTPResponse(status=401, output="Yeah, if you could log in, that'd be great.")

@put('/api/users/:username/schedules/:sid')
def update_schedule(username, sid, mongodb):
    '''
    Input: json schedule document with updates
    Output: Status 204 No Content, and Location with the schedule id

    Checks for valid user session. If the session checks out, the schedule
    is updated with the new values in the request. If the session is not valid,
    status 401 Unauthorized is returned.
    '''
    # Check session cookie. Returns username if matched; otherwise, None.
    session_user = request.get_cookie('sessions', secret=secret_key)
    if session_user:    # Do your thing, man.
        try:
            # Validate json data from request.
            validictory.validate(request.json,schedule_schema)
            # Update schedule
            if 'courses' not in request.json.keys():
                # Clears all courses from schedule document if courses is
                # not in the json object in the request.
                request.json['courses'] = []
            mongodb.schedules.update({'_id': ObjectId(sid)}, {'$set': request.json})
        except ValueError, error:
            # Return 400 status and error from validation.
            return HTTPResponse(status=400, output=error)

        response.status = 204
        response.headers['location'] = '/api/users/%s/schedules/%s' % (username, sid)
        return
    else:   # Access Denied
        return HTTPResponse(status=401, output="Yeah, if you could log in, that'd be great")

@get('/api/users/:username/schedules/:sid')
def get_schedule(username, sid, mongodb):
    '''
    Input: schedule id, sid
    Output: Schedule document

    Queries and returns the schedule document with the given id.
    '''
    user = mongodb.users.find_one({'username': username})
    if user:    # Valid user
        try:    # Query db for schedule with user_id and sid
            s = mongodb.schedules.find_one({'_id': ObjectId(sid), 'user_id': user['_id']})
            # If schedule is found, return it. Otherwise, return 404.
            return s if s else \
                HTTPResponse(status=404, output="User %s does not own schedule %s" % (username,sid))
        except:     # sid in url is not a valid mongo id
            return HTTPResponse(status=400, output="Not a valid schedule id.")
    return HTTPResponse(status=400, output="Not a valid user.")

@get('/api/users/:username/schedules')
def get_all_schedules(username, mongodb):
    '''
    Input: username
    Output: List of schedules for user

    Queries and returns all schedule documents for the given user
    '''
    user = mongodb.users.find_one({'username': username})
    if user:    # Valid user
        return mongodb.schedules.find({'user_id': user['_id']})
    return HTTPResponse(status=400, output="Not a valid user.")

run(host='0.0.0.0', port=8080, debug=True, reloader=True)
