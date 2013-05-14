#!/usr/bin/node
var request = require('request');
var fs = require('fs');
var config = require('./config.js');



function log_notice(msg, fatal) {
	console.log("Notice: "+msg)
	if(!fatal)
		return false
	else
		return true
}
function log_fatal(msg) {
	console.log("Fatal Error: "+msg+" (Exit)")
	process.exit(1)
}
function update_stale_records(current_ip) {
	request.post(
		config.endpoints.cloudflare,
		{form: {
			act: "rec_load_all",
			a: "rec_load_all",
			email: config.cloudflare.email,
			tkn: config.cloudflare.tkn,
			z: config.cloudflare.zone
		}},
		function(error, response, body) {
			if(!error && response.statusCode == 200) {
				//console.log(response)
				reply = JSON.parse(response.body)
				if(reply.result == "error")
					log_fatal("There was an error getting record list ("+reply.msg+")")
				
				records = reply.response.recs.objs

				records.forEach(function(record) {
					if(record.type != "A")
						return log_notice("Skipping "+record.type+" record "+record.name+" as not an A record")
					if(record.content == current_ip)
						return log_notice("Skipping record "+record.name+" as IP addres is not stale");
					else
						update_stale_record(record)
				})			
			}
		}
	);
}
function update_stale_record(record) {
	request.post(
		config.endpoints.cloudflare,
		{form: {
			email	: config.cloudflare.email,
			tkn	: config.cloudflare.tkn,
			act	: "rec_edit",
			a	: "rec_edit",
			z	: config.cloudflare.zone,
			type	: record.type,
			id	: record.rec_id,
			content : current_ip,	
			name	: record.name,
			ttl	: record.ttl,
			service_mode: record.service_mode,
		}},
		function(error, response, body) {
			if(!error && response.statusCode == 200) {
				//console.log(response)
				response = JSON.parse(response.body)
				if(response.result == "error") {
					log_notice("There was an error updating "+record.name+": "+response.msg)
				
				} else {
					log_notice(record.name+" successfully updated")
				}
			} else
				log_notice("There was an error updating "+record.name)
		}
	);
}
// First we need to get the current saved public IP address
fs.readFile(".current_public_ip", function(err, data) {
	if(err) {	
		if(err.code == 'ENOENT') {	
			log_notice("IP File doesnt exist, creating blank one.")
			fs.writeFile(".current_public_ip", "")
		} else throw err
	}
	stored_ip = data;
	request.get(config.endpoints.ip, function(error, response) {
		current_ip = response.body
		
		if(current_ip == "")
			log_fatal("Could not determine current IP address")
		else
			log_notice("Current IP address from server is "+current_ip)
		
		if(current_ip != stored_ip) {
			log_notice("Cached and current IP addresses do not match, will update DNS")
			fs.writeFile(".current_public_ip", current_ip, function(err) {
				if(err)
					log_notice("There was an error updating the cached IP file")
				else
					log_notice("The cached IP was updated to "+current_ip)
			})
			update_stale_records(current_ip);
		} else
			return log_notice("Current IP is the same as the cached IP, no need to update")
	})
})

