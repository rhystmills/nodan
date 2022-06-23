### Command line node/typescript tool to brute force https login forms

```
                           <\              _
                            \\          _/{
                     _       \\       _-   -_
                   /{        / `\   _-     - -_
                 _~  =      ( @  \ -        -  -_
               _- -   ~-_   \( =\ \           -  -_
             _~  -       ~_ | 1 :\ \      _-~-_ -  -_
           _-   -          ~  |V: \ \  _-~     ~-_-  -_
        _-~   -            /  | :  \ \            ~-_- -_
     _-~    -   _.._      {   | : _-``               ~- _-_
  _-~   -__..--~    ~-_  {   : \:}
=~__.--~~              ~-_\  :  /
                           \ : /__
                          //`Y'--\\      
                         <+       \\
                          \\      WWW
                          MMM
```
### Running:
- run `npm build`, or `npm watch` (watching for changes) to build
- run `npm start`

Command should look like, e.g.

e.g.
`npm run start -- -u users.txt -p passwords.txt -t https://example.com/login  -f user:{USER} pass:{PASS} extra_param:myParam`

