CodeRoom
So, ever since I was in Grade 9, I have been fortunate to tutor many juniors and my own classmates on programming languages. However I always wished if there was 1 platform where student may write code, teacher may write code and explain, teacher can review code, there is an inbuilt compiler, you can enter input aswell and everything mentioned so far happens in real time and update reflects on both ends. This very wish mentioned above is CodeRoom, where you can tutor students or simply review code.

Dependencies:
Frontend: React, Vite, CodeMirror, Socket.io
Backend: Node, Express, Socket.io, Redis, BullMQ
Compiler-Service: Node, Express, Redis, BullMQ, Docker

Problem it solves:
As mentioned in description of project, the goal was to have 1 platform where there is synchronised coding, reviewing, compiling system.

Visit:
CodeRooms have already been deployed. 

https://satnaamcoderoom.vercel.app/

Note: The current backend is on Render and if the server is inactive it might take upto 30-50sec for it to run. So it might take some time, dont panic, the application is not broken.


Development Journey:
Well originally this project was made in a monolithic format with backend and compiler service as a single backend and no Redis components to handle Rooms and compialtion queue was simply non-existent, but the issue was that there was no hosting platform that could handle the custom Docker commands that this project required, so quickly a solution was found that we can use the free Oracle VM and host it there, the frontend on vercel and connect them both. We also faced many issues through this 2 month journey of making 1.0.0 possible, in this development journey we have mentioned few of those issues that we thought caused siginificant change in our design decisions and overall system architectures.

Issue: Need of synchronised code.


Issue 1: Unsafe compilation, The first issue was how to make compilation safe, as any machine could run a c++ program but that means if User tries to run something malicious, then it could crash the VM or obvioiusly cause security risk to other users.

Solution: Instead of making execute natively on the vm, we decided if we could make it execute inside a docker container with limited resources, a TTL and no network access, no matter what kind of code the user exectues it wont cause problem on our main machine. Hence, we used Docker and now every execution creates a brand new container that has TTL of 10s (we believe its a reasonable limit for now) and has limited system resources access and also no network access. This improves security.

Issue 2: The first difficulty was that VM's public IP had to be linked to a domain so as to our frontend could connect to it so a free domain was generated (this caused problems of its own and will be discussed later in issue 4). Secondly, there was alot of custom configuration in firewall of the VM to allow connection to frontend.But main issue was that our backend could only communicate through HTTP, connection between it and vercel (which used HTTPS) simply wasnt possible and writing the express app to use HTTPs instead was a tedious task.

Solution: Nginx was used as reverse proxy, the backend ran on the localhost and Nginx  handeled the HTTPS request and response by acting as a bridge between our frontend's connection to Server (over HTTPS) and our backend's connection to Nginx (over HTTP)
It was roughly like
                                    Reverse Proxy
    [Frontend] ------HTTPS--------[---( Nginx  )------HTTP----(Backend)]
      Vercel                                         Oracle VM
and this nicely handled our first issue

Issue 3: Scalability: due to this monolithical state our Project had basically no scalability, our rooms lived inside server's own memory and even if we attatched a traffic controller in front of many backend servers then chance of generating a duplicate room was there as another server might have same room code which was out of reach of other

Solution: Used Redis as a single source of Room State tracking throughout the system, now even if we introduced new servers, they all connect to the Redis database and there is a special check to make sure no duplicate it made. Moreover, if a server fails in future, we can add code to transfer handeling of those room to other servers. Now room state and data is not bound to 1 server but a shared Redis. Also we seprated compiler into its own seprate service to improve scalability (as now compiler service can exist on seprate servers) and introduce sepration of concerns.

Issue 4: Backend Blocked by Many Networks/DNS, as our Backend was originally deployed on oracle VM and we had to generate a free domain, many DNS and networks flagged the domain as suspicious and didnt allow our frontend (which was deployed on vercel) to connect with it directly. And simply there was no universal button that could enable it back.

Solution: The solution was simple as our Compiler-Service and Main Backend were now separated, it was decided that for the best and avoiding this block, lets deploy our main backend on a platform which is trusted and well known as that would mean, its possibly not blocked by user networks and DNS' hence our frontend can connect to it without issue. And then we instead host only and only Compiler-Service on our VM (this would also reduce overhead for each compilation request) and connect our main backend to it directly, this way frontend would not have direct connection to the Oracle VM and our main backend would connect. Now our Frontend is on Vercel, Backend is on Render and our Compiler Service runs on Oracle VM which our main backend connects to without any issue.

Issue: Unsecure Connection at Compiler Service


Issue 5: Overwhelming the VM. Our compiler service didnt have any limits on as to how many compilations per time, the VM had limited resources, and more than 4 compilations together began to slow it down, preventing crash and improving uptime and performance was major concern here.

Solution: Instead of sending compilation request over HTTPS to our Service (originally our service used SaaS Authentication), we instead decided to link our compilerController on Backend and our Compilation Service on Compiler-Service with over Redis and introduce a BullMQ compile request queue. Now the Backend became a producer and sent items into the queue whcih were stored in redis that connected both the backend and compiler-service and the compiler-service acted as a worker and only worked on 3 requests at a time and then send back the result and delete the request from the redis so as to not overwhelm it. This improved performance and uptime. Obviously, at this scale it works very smoothly and fine but if this project was to grow then we would need more powerful machines in much quantity as with current setup its possible a user might have to wait many minutes before their compilation request could be fulfiled if all the services are at capacity.



Local Installation:

Note: If you want to run this locally, you might need to setup your own Redis Databases for Room Service and Compile Request Queue and set up the connection parameters if you are using the same Redis hosts (Redis for RoomService, Upstash for Compile Request Queue) in .env or customise the config files and .env yourself.
Pre-requisites: Have Docker installed on your device.

Step 1:
Clone the repo

Step 2: 
Go into each of the following: backend, compiler-service, frontend and install all dependencies needed using 
npm install

Step 3:
Setting up .env files
below are the listed env files, fill them with proper parameters

backend's .env
PORT=3000
CLIENT_URL="http://localhost:5173"

//Redis-Room Data
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_HOST=
REDIS_PORT=

//Redis-Queue Data
COMPILE_QUEUE_REDIS_URL=

//Compiler Microservice
COMPILER_SERVICE_URL="
COMPILER_SERVICE_API_KEY=

compiler-service' .env
PORT=4000
COMPILER_SERVICE_API_KEY=

//Redis-Queue Data
COMPILE_QUEUE_REDIS_URL=

frontend's .env
VITE_SERVER_URL=http://localhost:3000


ARCHITECTURE
The architecture of project doesnt follow a strict single type but rather a mix of 3, primarily its a layered architecture type but it consists of elements of event driven (due to socket.io) and service based (due to sepration of compiler service) architecture.
<img width="5821" height="2777" alt="Final Architecture Diagram" src="https://github.com/user-attachments/assets/49f9bab1-9b61-459f-bc37-a9fb35eec71d" />

