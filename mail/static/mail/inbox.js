document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-display').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-display').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    // ... do something else with emails ...
    emails.forEach((email) => {
      const email_div = document.createElement('div');
      email_div.className = 'email-div'
      email_div.innerHTML = `<p><strong>${email.sender}</strong><span>${email.subject}</span></p>
                      <p>${email.timestamp}</p>`;

      email_div.classList.add(email.read ? 'read' : 'unread');

      email_div.addEventListener('click', function() {
        email_div.classList.add('read')
        view_email(email.id, mailbox)
      });

      document.querySelector('#emails-view').append(email_div)
    })
  })
  .catch(error => {
    console.log('Error:', error);
  });
}


function send_email(event) {
  event.preventDefault();
  const form = document.querySelector('#compose-form');
  let element = form.elements

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: `${element.recipients.value}`,
      subject: `${element.subject.value}`,
      body: `${element.body.value}`
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    load_mailbox('sent');
  });
}


function view_email(id, mailbox) {

  document.querySelector('#email-display').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#email-display').innerHTML = `
    <div class="sender">
      <strong>From:  </strong>${email.sender}
    </div>
    <div class="recipients">
        <strong>To:  </strong>${email.recipients}
    </div>
    <div class="subject">
        <strong>Subject:  </strong>${email.subject}
    </div>
    <div class="timestamp">
        <strong>Time:  </strong>${email.timestamp}
    </div>
    <hr>
    <div class="body">
        <p>
          ${email.body}
        </p>
    </div>`;

    if (!email.read) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    const reply_btn = document.createElement('button');
    reply_btn.innerHTML = 'Reply';
    reply_btn.className = 'm-1 btn btn-outline-primary'
    reply_btn.addEventListener('click', function() {
      compose_email()
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    })
    document.querySelector('#email-display').append(reply_btn)

    if (mailbox === 'inbox' || mailbox === 'archive') {
      const archive_btn = document.createElement('button');
      archive_btn.innerHTML = email.archived ? 'Unarchive' : 'Archive';
      archive_btn.className = email.archived ? 'm-1 btn btn-outline-danger' : 'm-1 btn btn-outline-success';
      archive_btn.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then(() => {load_mailbox('inbox')})
      })
      document.querySelector('#email-display').append(archive_btn)
    }
  });
}