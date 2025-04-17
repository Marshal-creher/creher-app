
import React, { useEffect } from 'react';

const NetlifyFormSetup: React.FC = () => {
  useEffect(() => {
    const form = document.createElement('form');
    form.setAttribute('name', 'contact');
    form.setAttribute('data-netlify', 'true');
    form.setAttribute('hidden', 'true');
    
    const nameInput = document.createElement('input');
    nameInput.setAttribute('name', 'prenom');
    form.appendChild(nameInput);
    
    const lastNameInput = document.createElement('input');
    lastNameInput.setAttribute('name', 'nom');
    form.appendChild(lastNameInput);
    
    const emailInput = document.createElement('input');
    emailInput.setAttribute('name', 'email');
    form.appendChild(emailInput);
    
    const phoneInput = document.createElement('input');
    phoneInput.setAttribute('name', 'telephone');
    form.appendChild(phoneInput);
    
    const cvInput = document.createElement('input');
    cvInput.setAttribute('name', 'cv');
    form.appendChild(cvInput);
    
    const letterInput = document.createElement('input');
    letterInput.setAttribute('name', 'lettre');
    form.appendChild(letterInput);
    
    document.body.appendChild(form);
    
    return () => {
      document.body.removeChild(form);
    };
  }, []);

  return null;
};

export default NetlifyFormSetup;
