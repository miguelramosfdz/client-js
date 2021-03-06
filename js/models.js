/* global WP_API_Settings:false */
// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function( wp, WP_API_Settings, Backbone, window, undefined ) {

	'use strict';

	var parseable_dates = [ 'date', 'modified' ];

	/**
	 * Backbone model for single users
	 *
	 * @type {*}
	 */
	wp.api.models.User = Backbone.Model.extend( {
		idAttribute: 'ID',

		urlRoot: WP_API_Settings.root + '/users',

		defaults: {
			ID: null,
			username: '',
			email: '',
			password: '',
			name: '',
			first_name: '',
			last_name: '',
			nickname: '',
			slug: '',
			URL: '',
			avatar: '',
			meta: {
				links: {}
			}
		},

		avatar: function( size ) {
			return this.get( 'avatar' ) + '&s=' + size;
		}
	});

	/**
	 * Backbone model for a post status
	 */
	wp.api.models.PostStatus = Backbone.Model.extend( {
		idAttribute: 'slug',

		urlRoot: WP_API_Settings.root + '/posts/statuses',

		defaults: {
			slug: null,
			name: '',
			'public': true,
			'protected': false,
			'private': false,
			queryable: true,
			show_in_list: true,
			meta: {
				links: {}
			}
		},

		/**
		 * This model is read only
		 */
		save: function() {
			return false;
		},

		'delete': function() {
			return false;
		}
	});
	
	/**
	 * Backbone model for media items
	 */
	wp.api.models.Media = Backbone.Model.extend( {
		idAttribute: 'ID',

		urlRoot: WP_API_Settings.root + '/media',

		defaults: {
			ID: null,
			title: '',
			status: 'inherit',
			type: 'attachment',
			author: {},
			content: '',
			parent: 0,
			link: '',
			date: new Date(),
			modified: new Date(),
			format: 'standard',
			slug: '',
			guid: '',
			excerpt: null,
			menu_order: 0,
			comment_status: 'open',
			ping_status: 'open',
			sticky: false,
			date_tz: 'Etc/UTC',
			modified_tz: 'Etc/UTC',
			meta: {
				links: {}
			},
			terms: [],
			source: '',
			is_image: true,
			attachment_meta: {}
		}
	});

	/**
	 * Model for taxonomy
	 */
	wp.api.models.Taxonomy = Backbone.Model.extend({
		idAttribute: 'name',

		defaults: {
			name: null,
			slug: '',
			labels: [],
			types: [ 'post' ],
			show_cloud: false,
			hierarchical: false,
			meta: {
				links: {}
			}
		},

		url: function() {
			var name = this.get( 'name' );
			name = name || '';

			return WP_API_Settings.root + '/posts/types/' + this.defaultPostType() + '/taxonomies/' + name;
		},

		/**
		 * Use the first post type as the default one
		 *
		 * @return string
		 */
		defaultPostType: function() {
			var types = this.get( 'types');

			if ( typeof types !== 'undefined' && types[0] ) {
				return types[0];
			}

			return null;
		}
	});

	/**
	 * Backbone model for term
	 */

	wp.api.models.Term = Backbone.Model.extend({

		idAttribute: 'ID',

		type: 'post',

		taxonomy: 'category',

		initialize: function( attributes, options ) {
			if ( typeof options !== 'undefined' ) {
				if ( options.type ) {
					this.type = options.type;
				}

				if ( options.taxonomy ) {
					this.taxonomy = options.taxonomy;
				}
			}
		},

		url: function() {
			var id = this.get( 'ID' );
			id = id || '';

			return WP_API_Settings.root + '/posts/types/' + this.type + '/taxonomies/' + this.taxonomy + '/terms/' + id;
		},

		defaults: {
			ID: null,
			name: '',
			slug: '',
			description: '',
			parent: null,
			count: 0,
			link: '',
			meta: {
				links: {}
			}
		}

	});

	/**
	 * Backbone model for pages
	 */
	wp.api.models.Page = Backbone.Model.extend( {
		idAttribute: 'ID',

		urlRoot: WP_API_Settings.root + '/pages',

		defaults: {
			ID: null,
			title: '',
			status: 'publish',
			type: 'page',
			author: new wp.api.models.User(),
			content: '',
			parent: 0,
			link: '',
			date: new Date(),
			modified: new Date(),
			date_tz: 'Etc/UTC',
			modified_tz: 'Etc/UTC',
			format: 'standard',
			slug: '',
			guid: '',
			excerpt: '',
			menu_order: 0,
			comment_status: 'closed',
			ping_status: 'open',
			sticky: false,
			password: '',
			meta: {
				links: {}
			},
			featured_image: null,
			terms: []
		}
	});


	/**
	 * Backbone model for single posts
	 *
	 * @type {*}
	 */
	wp.api.models.Post = Backbone.Model.extend( {

		idAttribute: 'ID',

		urlRoot: WP_API_Settings.root + '/posts',

		defaults: function() {
			return {
				ID: null,
				title: '',
				status: 'draft',
				type: 'post',
				author: new wp.api.models.User(),
				content: '',
				link: '',
				'parent': 0,
				date: new Date(),
				// date_gmt: new Date(),
				modified: new Date(),
				// modified_gmt: new Date(),
				format: 'standard',
				slug: '',
				guid: '',
				excerpt: '',
				menu_order: 0,
				comment_status: 'open',
				ping_status: 'open',
				sticky: false,
				date_tz: 'Etc/UTC',
				modified_tz: 'Etc/UTC',
				terms: {},
				post_meta: {},
				meta: {
					links: {}
				}
			};
		},

		/**
		 * Serialize the entity
		 *
		 * Overriden for correct date handling
		 * @return {!Object} Serializable attributes
		 */
		toJSON: function () {
			var attributes = _.clone( this.attributes );

			// Remove GMT dates in favour of our native Date objects
			// The API only requires one of `date` and `date_gmt`, so this is
			// safe for use.
			delete attributes.date_gmt;
			delete attributes.modified_gmt;

			// Serialize Date objects back into 8601 strings
			_.each( parseable_dates, function ( key ) {
				attributes[ key ] = attributes[ key ].toISOString();
			});

			return attributes;
		},

		/**
		 * Unserialize the entity
		 *
		 * Overriden for correct date handling
		 * @param {!Object} response Attributes parsed from JSON
		 * @param {!Object} options Request options
		 * @return {!Object} Fully parsed attributes
		 */
		parse: function ( response, options ) {
			// Parse dates into native Date objects
			_.each( parseable_dates, function ( key ) {
				if ( ! ( key in response ) ) {
					return;
				}

				var timestamp = wp.api.utils.parseISO8601( response[ key ] );
				response[ key ] = new Date( timestamp );
			});

			// Remove GMT dates in favour of our native Date objects
			delete response.date_gmt;
			delete response.modified_gmt;

			// Parse the author into a User object
			response.author = new wp.api.models.User( { username: response.author } );

			return response;
		},

		/**
		 * Get parent post
		 *
		 * @return {wp.api.models.Post} Parent post, null if not found
		 */
		parent: function() {
			var post,
				parent = this.get( 'parent' );

			// Return null if we don't have a parent
			if ( parent === 0 ) {
				return null;
			}

			// Can we get this from its collection?
			if ( this.collection ) {
				return this.collection.get(parent);
			}
			else {
				// Otherwise, get the post directly
				post = new wp.api.models.Post({
					ID: parent
				});

				// Note that this acts asynchronously
				post.fetch();
				return post;
			}
		}
	});

	/**
	 * Backbone model for comments
	 */
	wp.api.models.Comment = Backbone.Model.extend( {
		idAttribute: 'ID',

		defaults: {
			ID: null,
			post: null,
			content: '',
			status: 'approved',
			type: 'comment',
			parent: 0,
			author: new wp.api.models.User(),
			date: new Date(),
			date_tz: 'Etc/UTC',
			meta: {
				links: {}
			}
		},

		url: function() {
			var post_id = this.get( 'post' );
			post_id = post_id || '';

			var id = this.get( 'ID' );
			id = id || '';

			return WP_API_Settings.root + '/posts/' + post_id + '/comments/' + id;
		}
	});

	/**
	 * Backbone model for single post types
	 */
	wp.api.models.PostType = Backbone.Model.extend( {
		idAttribute: 'slug',

		urlRoot: WP_API_Settings.root + '/posts/types',

		defaults: {
			slug: null,
			name: '',
			description: '',
			labels: {},
			queryable: false,
			searchable: false,
			hierarchical: false,
			meta: {
				links: {}
			},
			taxonomies: []
		},

		/**
		 * This is a read only model
		 *
		 * @returns {boolean}
		 */
		save: function () {
			return false;
		},

		'delete': function () {
			return false;
		}
	});

})( wp, WP_API_Settings, Backbone, window );
