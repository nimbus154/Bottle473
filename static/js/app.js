var App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// pattern borrowed from
// http://stackoverflow.com/questions/12064765/initialization-with-serialize-deserialize-ember-js
App.DepartmentFetcher = {
    url: "/departments",
    all: function() {
        return this.getObjectsHelper(this.url);
    },
    classes: function(department) {
        return this.getObjectsHelper(this.url + "/" + department.abbrev);
    },
    getObjectsHelper: function(url) {
        var array = [];
        $.getJSON(url, function(data) {
            // Ember's observer pattern magic lets this populate everywhere!
            array.addObjects(data);
        });
        return array;
    }
}

var user = "admin";

App.Schedule = Ember.Object.extend({
    year: null,
    terms: [ ]
});

App.Term = Ember.Object.extend({
    term: null,
    classes: []
});

App.Department = Ember.Object.extend({
    name: null,
    abbrev: null
});

App.Class = Ember.Object.extend({
    name: null,
    number: 0,
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

App.CourseCatalogController = Ember.ArrayController.extend({
    //classes: App.Course.find() // get all classes from server
});

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
