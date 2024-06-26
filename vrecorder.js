// collect DOMs
const display = document.querySelector('.display')
const controllerWrapper = document.querySelector('.controllers')

const State = ['Initial', 'Record', 'Download']
let stateIndex = 0
let mediaRecorder, chunks = [], audioURL = ''
let userInfo = ""

// mediaRecorder setup for audio
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log('mediaDevices supported..')

    navigator.mediaDevices.getUserMedia({
        audio: true
    }).then(stream => {
        mediaRecorder = new MediaRecorder(stream)

        mediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data)
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' })
            chunks = []
            audioURL = window.URL.createObjectURL(blob)
            document.querySelector('audio').src = audioURL
        }
    }).catch(error => {
        console.log('Following error has occurred: ', error)
    })
} else {
    stateIndex = ''
    application(stateIndex)
}

const clearDisplay = () => {
    display.textContent = ''
}

const clearControls = () => {
    controllerWrapper.textContent = ''
}

const record = () => {
    stateIndex = 1
    mediaRecorder.start()
    application(stateIndex)
}

const stopRecording = () => {
    stateIndex = 2
    mediaRecorder.stop()
    application(stateIndex)
}

const saveUserInfo = (filename, name, sanitizedName, timestamp) => {
    const DOB = prompt("Please enter patient DOB:");
    const drName = prompt("(Optional) Please enter the name of the Physician: (defaults to Dr Pollikal)") || "Dr_Pollikal";
    const adm_date = prompt("(Optional) Please enter the date of first visit (defaults to today)") || new Date().toLocaleDateString('en-US');

    const userInfoFilename = `userinfo_${timestamp}_${sanitizedName}`;

    userInfo = `Patient Name: ${name}\nDOB: ${DOB}\nPhys_Name: ${drName}\naudioFile: ${filename}\nDate of Admission: ${adm_date}\n`;

    const userInfoBlob = new Blob([userInfo], { type: 'text/plain' });

    const userInfoLink = document.createElement('a');
    userInfoLink.href = URL.createObjectURL(userInfoBlob);
    userInfoLink.setAttribute('download', `${userInfoFilename}.txt`);
    userInfoLink.click();
}

const downloadAudio = () => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, ''); // Consistent timestamp format: YYYYMMDDTHHMMSS
    const name = prompt("Please enter patient first and last names:"); // Prompt for name here to sanitize it
    const sanitizedName = name.replace(/\s+/g, '_'); // replace spaces with underscores
    const filename = `audio_${sanitizedName}_${timestamp}.ogg`; // Construct filename using sanitized name and timestamp
    saveUserInfo(filename, name, sanitizedName, timestamp);
    const downloadLink = document.createElement('a');
    downloadLink.href = audioURL;
    downloadLink.setAttribute('download', filename); // Set filename
    downloadLink.setAttribute('target', '_blank'); // Open in new tab
    downloadLink.click();
    mailFiles();
}

const addButton = (id, funString, text) => {
    const btn = document.createElement('button')
    btn.id = id
    btn.setAttribute('onclick', funString)
    btn.textContent = text
    btn.style.width = "auto"; // Set width to "auto" for dynamic sizing
    btn.style.height = "auto"; // Set height to "auto" for dynamic sizing
    btn.style.padding = "10px 20px"; // Set padding for the button (adjust as needed)
    controllerWrapper.append(btn)
}

const addMessage = (text) => {
    const msg = document.createElement('p')
    msg.textContent = text
    display.append(msg)
}

const addAudio = () => {
    const audio = document.createElement('audio')
    audio.controls = true
    audio.src = audioURL
    display.append(audio)
}

const createMailtoLink = () => {
    console.log('Creating mailto link...');

    const recipient = 'notes@magicnotesai.com';
    const subject = 'audio recording';

    console.log('Retrieved user info:', userInfo);

    // Construct the email body using the saved user info
    const body = `Pls. attach the audiofile listed below :\n\nUserInfo: ${userInfo}\n`;

    // Encode the components to ensure proper formatting in the mailto link
    const encodedRecipient = encodeURIComponent(recipient);
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    // Construct the mailto link
    const mailtoLink = `mailto:${encodedRecipient}?subject=${encodedSubject}&body=${encodedBody}`;

    console.log('Mailto link created:', mailtoLink);

    return mailtoLink;
}

// Function to mail files
const mailFiles = () => {
    // console.log('Retrieved user info:', userInfo);
    addMessage('Mailing files, just attach the audio file')
    const mailtoLink = createMailtoLink();
    const newWindow = window.open(mailtoLink, '_blank');
    if (newWindow) {
        newWindow.opener = null; // Prevent the new window from accessing the parent window
    } else {
        // If the popup blocker prevents opening the new window, fallback to opening the link in the default browser
        window.location.href = mailtoLink;
    }
    return
}

const application = (index) => {
    switch (State[index]) {
        case 'Initial':
            clearDisplay()
            clearControls()

            addButton('record', 'record()', 'Start Recording')
            break;

        case 'Record':
            clearDisplay()
            clearControls()

            addMessage('Recording...')
            addButton('stop', 'stopRecording()', 'Stop Recording')
            break

        case 'Download':
            clearControls()
            clearDisplay()

            addAudio()
            addButton('download', 'downloadAudio()', 'Download & Mail Audio')
            addButton('record', 'record()', 'Record Again')
            break

        default:
            clearControls()
            clearDisplay()

            addMessage('Your browser does not support mediaDevices')
            break;
    }
}

application(stateIndex)
