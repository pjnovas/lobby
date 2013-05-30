'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    mochacov: {
      unit: {
        options: {
          reporter: 'spec'
        }
      },
      html: {
        options: {
          reporter: 'html-cov',
          output: 'coverage.html'
        }
      },
      coverage: {
        options: {
          reporter: 'mocha-term-cov-reporter',
          coverage: true
        }
      },
      coveralls: {
        options: {
          coveralls: {
            serviceName: 'travis-ci'
          }
        }
      },
      options: {
        files: 'test/*.js',
        ui: 'bdd',
        colors: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.registerTask('test', ['mochacov:unit', 'mochacov:coverage', 'mochacov:html']);
  grunt.registerTask('travis', ['mochacov:unit', 'mochacov:coverage', 'mochacov:coveralls']);
  grunt.registerTask('default', 'test');
};