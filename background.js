chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'performGesture') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];

      if (tab) {
        chrome.tabs.executeScript(
          tab.id, 
          {
            code: `
              (function() {
                const gesture = '${message.gesture}';
                console.log('Executing gesture:', gesture);
                switch (gesture) {
                  case 'up':
                    window.scrollBy(0, -10);
                    break;
                  case 'down':
                    window.scrollBy(0, 10);
                    break;
                  case 'left':
                     window.scrollBy(-10, 0);
                     break;
                  case 'right':
                    window.scrollBy(10, 0);
                    break;
                  case 'pause':
                    break;
                  default:
                    console.log('Unknown gesture:', gesture);
                }
              })();
            `
          }, function (result) {
            console.log('Gesture executed:', message.gesture);
          }
        );
      }
    });
  }
});
