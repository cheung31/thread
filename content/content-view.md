# LivefyreContentView

# States
* ```initial```
* ```rendered```
* ```has no tiled attachments```
* ```has tiled attachments```
* ```has no stacked attachments```
* ```has stacked attachments```
* ```has no controls```
* ```has left-footer controls```
* ```has right-footer controls```

# Behaviors
## render

## addFooterControl
Results in state ```has left-footer controls``` or ```has right-footer controls```.

## removeFooterControl
Results in state ```has no controls```, ```has left-footer controls```, or ```has right-footer controls```.