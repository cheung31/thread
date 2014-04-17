# Thread

## States
* ```initial``` - 
The thread has a root Content.

* ```0 children``` -
The thread's root Content has no direct descendent Content.

* ```>= 1 children``` - 
The thread's root Content has 1 or more direct descendent Content.

## Behaviors
### addChild
Results in the state, ```>=1 children```.

### removeChild
Removes a given direct descendent Content of the root Content. May result in state, ```0 children``` or ```>=1 children```, depending on the number of direct descendents.
