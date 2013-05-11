var App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

App.ObjectRetriever = Ember.Mixin.create({
    getObjects: function(url) {
        var array = [];
        $.getJSON(url, function(data) {
            // Ember's observer pattern magic lets this populate everywhere!
            array.addObjects(data);
        });
        return array;
    }
});

// pattern borrowed from
// http://stackoverflow.com/questions/12064765/initialization-with-serialize-deserialize-ember-js
App.DepartmentFetcher = Ember.Object.createWithMixins(App.ObjectRetriever, {
    url: "/departments",
    all: function() {
        return this.getObjects(this.url);
    },
    courses: function(deptAbbrev) {
        var url = this.url + "/" + deptAbbrev.toUpperCase();
        return this.getObjects(url);
    }
});

App.ScheduleStore = Ember.Object.createWithMixins(App.ObjectRetriever, {
    user: null,
    url: "/api/user/" + this.user + "/schedules",
    __saveOne: function(schedule, id) {
        // save a serverSchedule
        console.log("saving...");
        console.log(schedule);
        $.ajax({
            url: this.url,
            type: "put",
            contentType: "application/json",
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
           serverSchedule.user_id = "userID!!!";
           serverSchedule.courses = term.courses;

           context.__saveOne(serverSchedule, clientSchedule.id);
        });
    }
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

App.CourseCatalogController = Ember.ArrayController.extend({
    classes: App.DepartmentFetcher.courses("cpsc")
});

App.ScheduleController = Ember.ObjectController.extend();

App.TermController = Ember.ObjectController.extend({
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
