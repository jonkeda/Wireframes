# Client trial

## Sign in

The user signs in with email and password.

```wireframe id=login
wireframe clean
    Card w=300
        Vertical gap=16
            Label "**Sign in**"
            Label "E-mail:"
            TextInput "Enter your email" :txtEmail required
            Label "Password:"
            PasswordInput "Enter password" :txtPass required
            Checkbox "Remember me" :chkRemember
            Button "Sign in" :btnLogin primary
        /Vertical
    /Card
/wireframe
```
