var App = Ember.Application.create({
    LOG_TRANSITIONS: true // show routes for debugging
});

// wait until we get all schedules; advanceReadiness called in ScheduleStore.all
App.deferReadiness(); 

// mixin to extract common ajax retrieval
App.ObjectRetriever = Ember.Mixin.create({
    getObjects: function(url, successCallback) {
        var array = [];
        $.getJSON(url, function(data) {
            // Ember's observer pattern magic lets this populate everywhere!
            array.addObjects(data);
            if(successCallback) {
                successCallback(array);
            }
        });
        return array;
    },
    all: null, // retrieve all objects
    find: null // retrieve an object
});

App.Schedule = Ember.Object.extend({
    year: null,
    terms: []
});

App.Term = Ember.Object.extend({
    term: null,
    courses: []
});

App.Course = Ember.Object.extend({
    name: null,
    number: null,
    dept: null,
    prereqs: []
});

// pattern borrowed from
// http://stackoverflow.com/questions/12064765/initialization-with-serialize-deserialize-ember-js
App.DepartmentFetcher = Ember.Object.createWithMixins(App.ObjectRetriever, {
    url: '/departments',
    all: function() {
        return this.getObjects(this.url);
    },
    courses: function(deptAbbrev) {
        var url = this.url + '/' + deptAbbrev.toUpperCase();
        return this.getObjects(url);
    }
});

App.ScheduleStore = Ember.Object.createWithMixins(App.ObjectRetriever, {
    user: null,
    url: '/api/users/' + 'admin' + '/schedules',
    __saveOne: function(schedule, id) {
        // save a serverSchedule
        // not meant to be called externally
        console.log('saving...');
        console.log(schedule);
        $.ajax({
            url: this.url,
            type: 'put',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(schedule)
        });
    },
    save: function(clientSchedule) {
        // client schedule and server schedule are different objects
        // server schedule ~= client-side term
        var year, serverSchedule = {}, context = this;
        year = clientSchedule.get('year');

        clientSchedule.terms.forEach(function(term) {
           serverSchedule.semester = term.term;
           serverSchedule.year = year;
           serverSchedule.user_id = 'userID!!!';
           serverSchedule.courses = term.courses;

           context.__saveOne(serverSchedule, clientSchedule.id);
        });
    },
    all: function() {
        // retrieve all objects, then instantiate them as Ember objects
        return this.getObjects(this.url, function(array) {
            console.log(array);
            // start app
            // TODO handle ajax schedule load fail
            App.advanceReadiness();
        });
    }
});

// get a list of all user schedules
App.schedules = App.ScheduleStore.all();

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
        if(App.schedules.length == 0) {
            console.log("No schedules");
        }
        else {
            console.log("Shedules found");
        }
        thisYear = new Date().getFullYear();
        /*
        var startingSchedule = App.schedules.find(function(item) {
            return item.year == thisYear;
        });
        this.transitionTo('schedule', startingSchedule);
        */
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

App.CourseCatalogController = Ember.ArrayController.extend({
    classes: App.DepartmentFetcher.courses('cpsc')
});

App.ScheduleController = Ember.ObjectController.extend();

App.TermController = Ember.ObjectController.extend({
    add: function(course) {
        console.log('Adding ');
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
