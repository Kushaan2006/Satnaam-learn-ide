# CodeRoom

A real-time coding platform for students and teachers where you can write code, review code, provide console input, and run code in room sessions.

---

# Why I Built CodeRoom

Ever since I was in Grade 9, I have been fortunate to tutor many juniors and my own classmates in programming languages. However, I always wished there was one platform where a student could write code, a teacher could write code and explain, a teacher could review code, there was an inbuilt compiler, you could enter input as well, and everything mentioned so far happened in real time with updates reflected on both ends.

This very wish mentioned above is CodeRoom, where you can tutor students or simply review code.

Also, to provide a better user experience, no authentication was added, as we wanted it to be ready to go with a minimum number of clicks so anyone can use CodeRoom without needing an account. We can change this in the future if this feature is abused. Another project that demonstrates authentication and authorization is our [LinklyWinkly](https://github.com/Kushaan2006/Satnaam_Link_Shortner).

---

## Problem It Solves

As mentioned in the description of the project, the goal was to have one platform with a synchronised coding, reviewing, and compiling system.

---

## Visit

CodeRoom has already been deployed.

https://satnaamcoderoom.vercel.app/

> **Note:** The current backend is hosted on Render. If the server is inactive, it might take up to 30–50 seconds to start. So it may take some time — don't panic, the application is not broken.

---

## Features

* Real-time synchronized code editing
* Separate teacher and student workspaces
* Live code review
* C++ compilation
* Custom stdin input
* Isolated Docker execution
* Real-time room state
* Compilation queue with controlled concurrency
* No authentication means it's ready to go in just a few clicks, enhancing the user experience

---

## Language Supported

C++, with basic C support via `g++`.

---

## Future Vision

Add an AI-driven room where a student could simply ask for a code review, such as finding a bug and explaining it, advising improvements, etc.

---

## Tech Stack

### Frontend

React, Vite, CodeMirror, Socket.io

### Backend

Node, Express, Socket.io, Redis, BullMQ

### Compiler-Service

Node, Express, Redis, BullMQ, Docker

---

# Architecture

The architecture of the project doesn't follow a strict single type but rather a mix of three. Primarily, it follows a layered architecture, while also containing elements of event-driven architecture due to Socket.io and service-based architecture due to the separation of the compiler service.

<img width="5821" height="2777" alt="Final Architecture Diagram" src="https://github.com/user-attachments/assets/49f9bab1-9b61-459f-bc37-a9fb35eec71d" />

---

# Development Journey

Originally, this project was made in a monolithic format, with the backend and compiler service existing as a single backend. There were also no Redis components to handle rooms, and the compilation queue was simply non-existent.

The issue was that there was no hosting platform that could handle the custom Docker commands this project required, so a solution was quickly found: we could use the free Oracle VM and host it there, deploy the frontend on Vercel, and connect them both.

We also faced many issues throughout this two-month journey of making `1.0.0` possible. In this development journey, we have mentioned a few of those issues that we thought caused significant changes in our design decisions and overall system architecture.

Scalability improvements have also been mentioned throughout the issues below, as it seemed unfair to create a special issue for scalability when, one way or another, all the issues mentioned below impacted it and were solved sequentially.

---

## Issue 1: Unsafe Compilation

In the planning stage, one of the issues was how to make compilation safe. Any machine could run a C++ program, but that meant if a user tried to run something malicious, it could crash the VM, gain access, or obviously cause a security risk to other users.

### Solution

Instead of executing code natively on the VM, we decided to execute it inside a Docker container with limited resources, a TTL, and no network access.

Hence, we used Docker, and now every execution creates a brand-new container that has a TTL of 10 seconds (we believe it's a reasonable limit for now), limited access to system resources, and no network access.

This improves security.

---

## Issue 2

One of the first difficulties was that the VM's public IP had to be linked to a domain so that our frontend could connect to it. A free domain was therefore generated. This caused problems of its own, which are discussed later in Issue 4.

Secondly, there was a lot of custom configuration required in the VM's firewall to allow connections from the frontend.

But the main issue was that our backend could only communicate through HTTP. A connection between it and Vercel, which used HTTPS, simply wasn't possible, and writing the Express app itself to use HTTPS instead was a tedious task.

### Solution

Nginx was used as a reverse proxy. The backend ran on localhost, and Nginx handled the HTTPS requests and responses by acting as a bridge between our frontend's connection to the server over HTTPS and our backend's connection to Nginx over HTTP.

It was roughly like:

```text
                                    Reverse Proxy
    [Frontend] ------HTTPS--------[---( Nginx  )------HTTP----(Backend)]
      Vercel                                         Oracle VM
```

and this nicely handled our first issue.

---

## Issue 3: Scalability

Due to this monolithic state, our project had basically no scalability.

Our rooms lived inside the server's own memory, and even if we attached a traffic controller in front of multiple backend servers, there was still a chance of generating a duplicate room because another server might already have the same room code, which would be out of reach of the other server.

### Solution

We used Redis as a single source of room-state tracking throughout the system.

Now, even if we introduced new servers, they would all connect to the Redis database, and there is a special check to make sure no duplicate room is created.

Moreover, if a server fails in the future, we can add code to transfer the handling of those rooms to other servers. Room state and data are therefore no longer bound to one server but instead live in shared Redis storage.

We also separated the compiler into its own service to improve scalability, as the compiler service can now exist on separate servers, while also introducing separation of concerns.

---

## Issue 4: Backend Blocked by Many Networks/DNS

Our backend was originally deployed on an Oracle VM, and we had to generate a free domain for it.

Many DNS providers and networks flagged the domain as suspicious and didn't allow our frontend, which was deployed on Vercel, to connect to it directly. There was simply no universal button that could enable it again.

### Solution

The solution was simple.

As our Compiler-Service and Main Backend were now separated, it was decided that the best way to avoid this block was to deploy our main backend on a trusted and well-known platform.

That would mean it was less likely to be blocked by user networks and DNS providers, allowing our frontend to connect to it without issue.

We then decided to host only the Compiler-Service on our VM and connect our main backend to it directly. This also reduced the overhead handled by the VM.

This way, the frontend would not have a direct connection to the Oracle VM.

Now:

* Frontend is hosted on Vercel
* Backend is hosted on Render
* Compiler-Service runs on an Oracle VM

Our main backend connects to the compiler infrastructure without the frontend needing direct access to the VM.

---

## Issue 5: Insecure Connection at Compiler Service

When our compiler service was finally separated into its own service that anyone could call, it literally meant **"anyone"** could call it.

Anybody with the domain name could simply call something like `/compileMyCpp` *(not the actual path)* and send a POST request with a JSON body, which could create spam attacks and overload our server.

Moreover, our compiler containers consume significant resources, so this created another issue branching from spam requests.

### Solution

To prevent this, we added S2S authentication.

An API key was produced and given to both the backend and compiler service, and an S2S authentication middleware was introduced which ensured that only the backend could create this request and nobody could manually do it.

This restricted access to the compiler service.

> **PS:** This functionality is no longer used because the Backend and Compiler-Service no longer communicate with each other over HTTP. We talk more about this in Issue 6. However, the authentication middleware has been left untouched, so even if somebody discovered the API endpoint, unauthorized calls would still be blocked.

---

## Issue 6: Overwhelming the VM

Our compiler service didn't originally have any limit on how many compilations could run at one time.

The VM had limited resources, and more than four compilations running together began to slow it down. Preventing crashes while improving uptime and performance therefore became a major concern.

### Solution

Instead of sending compilation requests over HTTPS to our service, where we originally used S2S authentication, we decided to connect our `compilerController` on the Backend and our compilation worker on the Compiler-Service through Redis and introduce a BullMQ compilation request queue.

The Backend became a producer and sent items into the queue, which were stored in Redis connecting both the Backend and Compiler-Service.

The Compiler-Service acted as a worker and only worked on three requests at a time. It then sent back the result and removed the request from Redis, preventing the machine from becoming overwhelmed.

This improved performance and uptime.

Obviously, at this scale it works very smoothly, but if this project were to grow, we would need more powerful machines in greater quantity. With the current setup, it is possible that a user might have to wait several minutes before their compilation request can be fulfilled if all services are at capacity.

---

## Issue 7: Statelessness of the Program

If a user disconnected or closed the window, then the main problem was: the code, the room? Gone. You couldn't get it back.

This was problematic because a user could sometimes accidentally click back or exit the window.

### Solution

To tackle this issue, we stored in Redis not only the Room ID, but also the status of whether the student and teacher are connected or not, along with their recovery tokens.

The recovery token's hash is stored in Redis instead of the raw token, so in case a data leak is experienced (low chance), the recovery tokens would be pretty useless as only their hashes are stored.

The recovery tokens are generated once a user creates or joins a room, and they are stored in local storage along with the user's code and the other person's code.

If a user disconnects and the other user is still there, the room remains present.

Now, whenever the disconnected user opens CodeRoom again, the option to rejoin will be given on the Join page. Once the user clicks on it, first the recovery token is hashed and matched with the hash present in Redis, and then the room is rejoined.

The user's own code is also sent back through Socket.io to the person in front, as behind the scenes the user could've simply changed it while disconnected.

If both users of the room exit, then a TTL of 7 minutes starts. After that, the room will be permanently deleted.

**Work in Progress:** Display code from previous rooms even after the room has been deleted.

---

# Other Issues

## Issue: Need for Synchronised Code

One of the visions of this project was real-time synchronisation of code.

Whenever code changes, review code changes, input changes, or the Run button is pressed and output is received, we wanted those changes to reflect on both sides.

### Solution

The use of Socket.io eliminated this issue entirely.

Code and other components could be synchronised in real time. The Socket.io client lives in the React frontend, while our backend validates Socket.io data and emits events containing data to listeners.

Socket.io is handled using `useEffect`, which creates the required event listeners when the linked component mounts and destroys them when the component unmounts.

---

# Local Installation

> **Note:** If you want to run this locally, you might need to set up your own Redis databases for Room Service and the Compile Request Queue, and configure the connection parameters. If you are using the same Redis hosts as the project (Redis for RoomService and Upstash for the Compile Request Queue), add the required values to `.env`. Otherwise, customise the config files and `.env` yourself.

## Pre-requisites

Have Docker, Node and npm installed on your device.
PS: Any other package manager except for npm should work aswell.

---

## Step 1

Clone the repo.

---

## Step 2

Go into each of the following folders:

* `backend`
* `compiler-service`
* `frontend`

Install all dependencies in each folder using:

```bash
npm install
```

---

## Step 3

Set up the `.env` files.

Below are the required environment variables. Fill them with the proper parameters.

### backend's `.env`

```env
PORT=3000
CLIENT_URL="http://localhost:5173"

# Redis-Room Data
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_HOST=
REDIS_PORT=

# Redis-Queue Data
COMPILE_QUEUE_REDIS_URL=
```

### compiler-service's `.env`

```env
PORT=4000
COMPILER_SERVICE_API_KEY=

# Redis-Queue Data
COMPILE_QUEUE_REDIS_URL=
```

### frontend's `.env`

```env
VITE_SERVER_URL=http://localhost:3000
```

---

## Step 4

First, make sure your Redis databases are up and running.

Now we are ready to run the application, as all our setup has been finished.

First, open the `backend` folder in terminal/cmd and type:

```bash
node src/server.js
```

Now open the `compiler-service` folder in terminal and type:

```bash
node src/server.js
```

Finally, to use CodeRoom, open the `frontend` folder in terminal and type:

```bash
npm run dev
```

The terminal will now show the local development link. While holding `Ctrl`, left-click the link and CodeRoom will open in your browser.

---

# Current Limitations

* Language supported: C++, with basic C support via `g++`.
* The current backend is hosted on Render, so if the server is inactive it might take up to 30–50 seconds to start.
* No authentication has been added, as we wanted CodeRoom to be ready to go with the minimum number of clicks and without requiring an account.
* The Compiler-Service currently acts as a worker and handles only three requests at a time.
* With the current setup, it is possible that a user might have to wait several minutes before their compilation request can be fulfilled if all services are at capacity.


Author: Kushaan Vir Singh
