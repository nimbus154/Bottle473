var App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

var user = "admin";

App.Store = DS.Store.extend({
    revision: 12,
    adapter: DS.RESTAdapter
});

// Modify the RESTAdapter to fit our POST/PUT format
// These are slight modifications to the methods in the Ember library.
// By default, Ember would post {"schedule":{}}, but we want just the object.
// https://github.com/emberjs/data/blob/master/packages/ember-data/lib/adapters/rest_adapter.js#L121
DS.RESTAdapter.reopen({
    url: '/api/users/' + user,
    createRecord: function(store, type, record) {
        var root = this.rootForType(type);
        var adapter = this;

        return this.ajax(this.buildURL(root), "POST", {
            data: this.serialize(record, { includeId: true })
        }).then(function(json){
            Ember.run(adapter, 'didCreateRecord', store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        });
    },
    updateRecord: function(store, type, record) {
        var id, root, adapter;

        id = get(record, 'id');
        root = this.rootForType(type);
        adapter = this;

        return this.ajax(this.buildURL(root, id), "PUT",{
            data: this.serialize(record)
        }).then(function(json){
            Ember.run(adapter, 'didUpdateRecord', store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        });
    }
});

// Define how to serialize arrays
DS.RESTAdapter.registerTransform('array', {
    serialize: function(value) {
        return JSON.stringify(value);
    },
    deserialize: function(value) {
        return JSON.parse(value);
    }
});

App.Department = DS.Model.extend({
    name: DS.attr('string'),
    abbrev: DS.attr('string')
});

App.Class = DS.Model.extend({
    name: DS.attr('string'),
    number: DS.attr('number'),
    dept: DS.attr('string'),
    prereqs: DS.attr('array')
});

App.Schedule = DS.Model.extend({
    semester: DS.attr('string'),
    year: DS.attr('string'),
    user_id: DS.attr('string'),
    courses: DS.attr('array')
});


// thanks to http://jsfiddle.net/ud3323/5uX9H/ for drag n' drop tips
App.ClassView = Ember.View.extend({
    templateName: 'class',
    attributeBindings: 'draggable',
    draggable: 'true',
    dragStart: function(event) {
        var dataTransfer = event.dataTransfer;
        var course = this.get('context'); // the item being dragged
        dataTransfer.setData('application/json', JSON.stringify(course));
    }
});

App.TermView = Ember.View.extend({
    templateName: 'term',
    dragOver: function(event) {
        event.preventDefault();
        return false;
    },
    drop: function(event) {
        event.preventDefault();
        var rawData = event.dataTransfer.getData('application/json');
        var course = App.Class.create(JSON.parse(rawData));
        console.log(this.get('controller'));
        this.get('controller').add(course);
        return false;
    }
});

App.Router.map(function() {
    this.resource('schedule', {path: '/schedule/:year'});
});

App.IndexRoute = Ember.Route.extend({
    renderTemplate: function() {
        thisYear = new Date().getFullYear();
        console.log(App.Department.find());
        var startingSchedule = App.schedules.find(function(item) {
            return item.year == thisYear;
        });
        this.transitionTo('schedule', startingSchedule);
    }
});

App.ScheduleRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        controller.set('content', model);
    },
    model: function(params) {
        // return App.Schedule.find(params.year);
        return {};
    },
    serialize: function(model) {
        return { 'year': model.year };
    }
});

App.ClassCollector = Ember.Mixin.create({
    add: function(course) {
        console.log("Adding ");
        console.log(course);
        var inList = this.classes.find(function(item) {
            return item.get('dept') === course.get('dept') && 
                    item.get('number') === course.get('number'); 
        });
        if(!inList) {
            this.classes.addObject(course);
        }
    },
    remove: function(course) {
        this.classes.removeObject(course);
    }
});

App.CourseCatalogController = Ember.ArrayController.extend(App.ClassCollector );

App.ScheduleController = Ember.ObjectController.extend();

App.TermController = Ember.ObjectController.extend(App.ClassCollector, {
    add: function(course) {
        console.log("Adding ");
        console.log(course);
        var inList = this.get('classes').find(function(item) {
            return item.get('dept') === course.get('dept') && 
                    item.get('number') === course.get('number'); 
        });
        if(!inList) {
            this.get('classes').addObject(course);
        }
    },
    remove: function(course) {
        this.get('classes').removeObject(course);
    }
});
