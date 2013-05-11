App.Schedule = Ember.Object.extend({
    year: null,
    terms: [ ]
});


App.Term = Ember.Object.extend({
    term: null,
    classes: []
});

App.Class = Ember.Object.extend({
    name: null,
    number: 0,
    dept: null,
    prereqs: []
});

App.schedules = [
    App.Schedule.create({
        year: 2012,
        terms: [
            App.Term.create({
                term: 'fall',
                classes: [ 
                    App.Class.create({
                        name: 'Python',
                        number: 223,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    }),
                    App.Class.create({
                        name: 'Web Programming',
                        number: 473,
                        dept: 'cpsc',
                        prereqs: ['cpsc433']
                    }),
                    App.Class.create({
                        name: 'Java Enterprise',
                        number: 476,
                        dept: 'cpsc',
                        prereqs: ['cpsc362']
                    })
                ]
            }),
            App.Term.create({
                term: 'spring',
                classes: [ 
                    App.Class.create({
                        name: 'Calculus II',
                        number: '150b',
                        dept: 'math',
                        prereqs: ['math150a']
                    }),
                    App.Class.create({
                        name: 'Math Structures II',
                        number: '270b',
                        dept: 'math',
                        prereqs: ['math270a']
                    })
                ]
            }),
            App.Term.create({
                term: 'summer',
                classes: [ 
                    App.Class.create({
                        name: 'Calculus I',
                        number: '150a',
                        dept: 'math',
                        prereqs: []
                    }),
                    App.Class.create({
                        name: 'Math Structures I',
                        number: '270a',
                        dept: 'math',
                        prereqs: []
                    })
                ]
            }),
            App.Term.create({
                term: 'winter',
                classes: [ 
                    App.Class.create({
                        name: 'Intro to Programming',
                        number: '121',
                        dept: 'cpsc',
                        prereqs: []
                    }),
                    App.Class.create({
                        name: 'Ethics',
                        number: '311',
                        dept: 'cpsc',
                        prereqs: []
                    })
                ]
            })
        ]
    }),
    App.Schedule.create({
        year: 2013,
        terms: [
            App.Term.create({
                term: 'fall',
                classes: [ 
                    App.Class.create({
                        name: 'Software Engineering',
                        number: 362,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    }),
                    App.Class.create({
                        name: 'Database Programming',
                        number: 431,
                        dept: 'cpsc',
                        prereqs: ['cpsc332']
                    }),
                    App.Class.create({
                        name: 'Programming Languages and Translation',
                        number: 323,
                        dept: 'cpsc',
                        prereqs: ['cpsc240']
                    })
                ]
            }),
            App.Term.create({
                term: 'spring',
                classes: [ 
                    App.Class.create({
                        name: 'Software Design',
                        number: 462,
                        dept: 'cpsc',
                        prereqs: ['cpsc362']
                    }),
                    App.Class.create({
                        name: 'Data Security and Encryption',
                        number: 433,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    }),
                    App.Class.create({
                        name: 'Distributed Systems',
                        number: 551,
                        dept: 'cpsc',
                        prereqs: ['cpsc351']
                    })
                ]
            }),
            App.Term.create({
                term: 'summer',
                classes: [
                    App.Class.create({
                        name: 'Algorithms',
                        number: 335,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    })
                ]
            }),
            App.Term.create({
                term: 'winter',
                classes: [ 
                    App.Class.create({
                        name: 'Intro to Programming',
                        number: '121',
                        dept: 'cpsc',
                        prereqs: []
                    }),
                    App.Class.create({
                        name: 'Ethics',
                        number: '311',
                        dept: 'cpsc',
                        prereqs: []
                    })
                ]
            })
        ]
    })
];

var classes = [
    App.Class.create({
        name: 'Data Structures',
        number: 131,
        dept: 'cpsc',
        prereqs: ['cpsc121']
    }),
    App.Class.create({
        name: 'Assembly Language',
        number: 240,
        dept: 'cpsc',
        prereqs: ['cpsc131']
    }),
    App.Class.create({
        name: 'Programming Languages and Translation',
        number: 323,
        dept: 'cpsc',
        prereqs: ['cpsc131', 'cpsc240']
    }),
    App.Class.create({
        name: 'Operating Systems Concepts',
        number: 351,
        dept: 'cpsc',
        prereqs: ['cpsc240']
    })
];

var departments = [
    {
        name: 'Computer Science',
        abbrev: 'cpsc'
    },
    {
        name: 'Math',
        abbrev: 'math'
    }
];
