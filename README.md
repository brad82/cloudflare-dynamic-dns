cloudflare-dynamic-dns
======================

A small Node.JS script to update cloudflare DNS rules automagically

After switching to BT infinity I realised I no longer was provided a static IP. After much pleading with BT Support I finally decided to just write a script to update cloudflare with my now ever changing IP. I tried the perl script cloudflare provides for their DynDNS service but couldn't get it working in the 5 minutes I gave it.

TODO
====
- Daemonise this or just leave it as a cron job. I'm undecided
- Add a better logger with better alerting, if this crashes I'm screwed
- Only update records with the cached IP address as their current address
- Much more

This is very much a rough script I whipped up to keep my client server up and running in the immediate future. I don't know whether I will maintain this or just find another solution. Only time will tell...
