import LoginForm from '../LoginForm';

export default function LoginFormExample() {
  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <LoginForm 
        onSubmit={(email, password) => console.log("Login submitted:", email, password)}
        onRegisterClick={() => console.log("Register clicked")}
      />
    </div>
  );
}
