import RegistrationForm from '../RegistrationForm';

export default function RegistrationFormExample() {
  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <RegistrationForm 
        onSubmit={(data) => console.log("Registration submitted:", data)}
        onLoginClick={() => console.log("Login clicked")}
      />
    </div>
  );
}
