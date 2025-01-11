const socket = io();
const nicknameInput = document.getElementById("nickname")
const messageInput = document.getElementById("message-input")
const sendButton = document.getElementById("send-button")
const messagesDisplay = document.getElementById("messages-display")
const userNames = document.getElementById("user-names")
const leaveButton = document.getElementById("leave")
const allUserList = document.getElementById("allUserList")
const nicknameColorInput = document.getElementById("nicknameColorInput")

document.getElementById("message-input-area").style.visibility = "hidden"
let userList = []
let selectedUser = null
let nickname = ''
let selectedColor = ''
let userColors = {}

function hiddenNickname () {
    nickname = document.getElementById("nickname").value

    if (nickname.trim() !== "") {
        socket.emit("changeNickname", {
            nickname: nickname,
            color: selectedColor
        })
        document.getElementById("nickname-form-hidden").style.display = "none"
        document.getElementById("message-input-area").style.visibility = "visible"
    } else {
        const error = document.getElementById("error-nickname").textContent = "Por favor, digite um apelido."
    }
}

function addUserToList(user) {
    const userNamesElement = document.createElement('li')
    userNamesElement.innerHTML = user.nickname
    userNamesElement.style.color = user.color
    userNames.appendChild(userNamesElement)
    userNames.scrollTop = userNames.scrollHeight
}

function displayMessage(message) {
    const messageElement = document.createElement('div')
    messageElement.classList.add('message')
    messageElement.innerHTML = message
    messagesDisplay.appendChild(messageElement)
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight
}

function removeUserFromList(nickname) {
    const userListItems = document.querySelectorAll('#user-names li');
    userListItems.forEach(item => {
        if (item.textContent === nickname) {
            item.remove()
        }
    })
}

function sendMessage(message, targetUser = null) {
    if (message.trim() !== "") {
        if (targetUser) {
            const targetUserColor = userColors[targetUser]
            socket.emit('privateMessage', {
                message: message,
                recivedNickname: targetUser
            })
            displayMessage(`<span class="username">Falou para <span style="color: ${targetUserColor}">${targetUser}</span>: </span>${message}`)
        } else {
            socket.emit('publicMessage', message)
        }
        messageInput.value = ""

    }
}

function leaveChat() {
    socket.disconnect()
    window.location.reload()
}

function updateUIWithUserList(userList) {
    userNames.innerHTML = ""
    userColors = {}
    const sortedList = [...userList].sort((a, b) => a.nickname.localeCompare(b.nickname))
    sortedList.forEach((user) => {
        userColors[user.nickname] = user.color
        addUserToList(user)
    })
}

nicknameColorInput.addEventListener('change', () => {
    selectedColor = nicknameColorInput.value
})

socket.on('connect', () => {
    socket.emit('getExistingUsers')
})

socket.on('existingUsers', (userList) => {
    updateUIWithUserList(userList)
})

userNames.addEventListener('click', function(event) {
    if (event.target.tagName === 'LI') {
        const clickedUser = event.target.textContent
        if (clickedUser !== nickname) {
            selectedUser = event.target.textContent
            messageInput.placeholder = `Digite sua mensagem para o usuário ${selectedUser}...`
        }
    }
})

allUserList.addEventListener('click', function(event) {
    selectedUser = null
    messageInput.placeholder = `Digite sua mensagem...`

})

sendButton.addEventListener("click", () => {
    const message = messageInput.value
    sendMessage(message, selectedUser)
})

messageInput.addEventListener("keypress", (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        const message = messageInput.value
        sendMessage(message, selectedUser)
    } else if (event.key === 'Enter' && event.shiftKey) {

    }
})

socket.on('publicMessage', (messageData) => {
    displayMessage(`<span class="username" style="color: ${messageData.color}">${messageData.nickname}</span> falou: ${messageData.message}`)
})

socket.on('privateMessage', (data) => {
    console.log(data)
    displayMessage(`<span class="username">Mensagem privada de <span style="color: ${data.color}">${data.nickname}</span>: </span>${data.message}`)
})

socket.on('changeNickname', (userData) => {
    displayMessage(`<span class="username" style="color: ${userData.userColor}">${userData.nickname} </span>entrou na sala...`)
    addUserToList(userData.nickname, userData.userColor)
})

socket.on('userDisconnected', (disconnectUserData) => {
    console.log(disconnectUserData)
    removeUserFromList(disconnectUserData.nickname)
    displayMessage(`<span class="username" style="color: ${disconnectUserData.color}">${disconnectUserData.nickname} </span>saiu da sala...`)
})