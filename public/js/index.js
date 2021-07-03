const getTotalUserCount = () => {
    fetch("/total-user")
        .then(response => response.json())
            .then(data => {
                userCount.innerHTML += data.count;

                document.body.appendChild(userCount);
            });   
}

getTotalUserCount();

let partner;
let interest;
let btnClicked = 1;
const socket = io();

//Join Chat
const handleConnection = () => {
    messageInfo.innerHTML = "Looking for someone to join";
    socket.emit('join-chat', interest);

    newChat.disabled = true;
    messageInput.disabled = true;
    messageBtn.disabled = true;

    socket.on("partner", id => {
        partner = id;

        messageInput.disabled = false;
        messageBtn.disabled = false;
        newChat.disabled = false;
        messageInfo.innerHTML = "Someone connected to the chat. Say Hi!!";
    });
}

//Changing screen and calling function to join the chat
const handleScreenSwitch = () => {
    interest = interestInput.value.trim().toLowerCase();

    startingScreen.replaceWith(chatScreen);
    document.body.removeChild(userCount);

    handleConnection();
}

//Handle Disconnect
socket.on('user disconnected', () => {
    messageInput.disabled = true;
    messageBtn.disabled = true;
    messageInfo.innerHTML = "Stranger Disconnected. Click Next To find Someone Else!!";
    partner = null;
})

//Handle Manual Disconnect
const handleUserDisconnect = () => {
    if (btnClicked === 2 || partner === null) {
        btnClicked = 1;

        newChat.innerHTML = "NEXT";

        socket.emit("user disconnected", partner);
        const messages = document.querySelectorAll('.message-block');
        for (message of messages) {
            message.remove();
        }
    
        handleConnection();
    } else {
        btnClicked ++;
        newChat.innerHTML = "SURE ?"
    }
}

//Emiting the user is typing
const handleUserIsTyping = event => {
    const value = event.target.value;

    if (value.trim() !== '') socket.emit('user typing', partner);
    else socket.emit('user not typing', partner);
}

//Sending message
const handleSendMessage = () => {
    const message = messageInput.value.trim();

    if (message === '') return

    const messageBlock = document.createElement('div');
    messageBlock.classList.add("message-block", "flex", "f-h-end", "f-v-center");

    const messageText = document.createElement('div');
    messageText.innerText = message;
    messageText.classList.add("message", "message-me", "flex", "f-center");

    messageBlock.appendChild(messageText);

    messageArea.appendChild(messageBlock);

    messageText.scrollIntoView({
        behavior: "smooth"
    })

    socket.emit('user not typing', partner);
    socket.emit('message', { to: partner, message });

    messageInput.value = '';
}

//Recieve message
socket.on('message', message => {

    const messageBlock = document.createElement('div');
    messageBlock.classList.add("message-block", "flex", "f-h-start", "f-v-center");

    const messageText = document.createElement('div');
    messageText.innerText = message;
    messageText.classList.add("message", "message-you", "flex", "f-center");

    messageBlock.appendChild(messageText);

    messageArea.appendChild(messageBlock);

    navigator.vibrate(400);
    
    messageText.scrollIntoView({
        behavior: "smooth"
    })
})

//Adding or removing User is typing text
socket.on('user typing', () => {
    messageInfo.innerHTML = "Stranger is typing ..."
})

socket.on('user not typing', () => {
    messageInfo.innerHTML = "";
})

//First Screen

//Header Text
const heading = document.createElement('h2');
heading.innerHTML = "WELCOME TO MECHAT";
heading.classList.add("heading", "flex", "f-center", "mb-20");

const text = document.createElement('div');
text.className = "t-center"

//Introductory para
const paragraphOne = document.createElement('p');
paragraphOne.innerText = "Heeyyy . Let me help you find a new mate for you!!. Let us connect to one and another event beyond the borders"
text.appendChild(paragraphOne);

const paragraphTwo = document.createElement('p');
paragraphTwo.innerText = "Lets start off this journey!!. Type an interest to get started";
text.appendChild(paragraphTwo);

const wrapper = document.createElement('div');
wrapper.classList.add("flex", "f-center");

//Interest Input
const interestInput = document.createElement('input');
interestInput.type = "text";
interestInput.classList.add("input", "input-interest");
interestInput.addEventListener('keydown', event => {
    event.key === "Enter" && interestBtn.click();
});

//Interest Button
const interestBtn = document.createElement('button');
interestBtn.innerHTML = "CONTINUE";
interestBtn.classList.add("btn", "interest-btn");
interestBtn.addEventListener('click', handleScreenSwitch)

wrapper.appendChild(interestInput);
wrapper.appendChild(interestBtn);

//Overall Screen
const startingScreen = document.createElement('div');

startingScreen.classList.add("app-screen")

startingScreen.appendChild(heading)
startingScreen.appendChild(text);
startingScreen.appendChild(wrapper)

const chatScreen = document.createElement('div');

const messageBox = document.createElement('div');
messageBox.classList.add('message-box', "flex", "f-center", "h-100", "relative");

const messageArea = document.createElement('div');
messageArea.classList.add("message-area", "absolute");

const messageInfo = document.createElement('div');
messageInfo.classList.add("message-info", "absolute", "t-center");

messageArea.appendChild(messageInfo);

const messageInput = document.createElement('input');
messageInput.type = "text";
messageInput.placeholder = "Type your message ...";
messageInput.classList.add("input-message");
messageInput.disabled = true;
messageInput.addEventListener('input', handleUserIsTyping);
messageInput.addEventListener('keydown', event => {
    event.key === "Enter" && messageBtn.click();
});

const messageBtn = document.createElement('button');
messageBtn.classList.add("btn", "btn-send");
messageBtn.innerHTML = "SEND";
messageBtn.addEventListener('click', handleSendMessage);
messageBtn.disabled = true;

const newChat = document.createElement('button');
newChat.classList.add("btn", "btn-next");
newChat.innerHTML = "NEXT";
newChat.disabled = true;
newChat.addEventListener('click', handleUserDisconnect);

const messageInputArea = document.createElement('div');
messageInputArea.classList.add("message-input-area", "flex", "f-center", "absolute");

messageInputArea.appendChild(newChat);
messageInputArea.appendChild(messageInput);
messageInputArea.appendChild(messageBtn);

messageBox.appendChild(messageArea);
messageBox.appendChild(messageInputArea);

chatScreen.appendChild(messageBox);

startingScreen.replaceWith(chatScreen);


//Appending FirstScreen to body
document.body.prepend(startingScreen);

const userCount = document.createElement('div');
userCount.classList.add("absolute", "user-count", "t-center");
userCount.innerHTML = "Active Users: "