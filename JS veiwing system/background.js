
//ye background.js mei sara API request de jayenge 
let cache = {}
let cacheTimes = []
let cacheDuration = 600000  
//yaha hum bas deafualt cache duration set kar rahe hai 
chrome.storage.local.get({cacheDuration: 600000}, function(settings) {
  if (settings && settings.cacheDuration !== undefined) {
    cacheDuration = settings.cacheDuration
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.query) {
    //ye case videoId ko fetch karne ke liye ek API request bheja
    case 'videoApiRequest':
     //yaha check karenge ki jo videoID cacheduration exceed kar raha hai uska cache data nikalenge 
      const now = Date.now()
      let numRemoved = 0
      for (const [fetchTime, videoId] of cacheTimes) {
        if (now - fetchTime > cacheDuration) {
          delete cache[videoId]
          numRemoved++
        } else {
          break
        }
      }
      //yaha cacheTimes ko katke denge length numRemoved ke barabar
      if (numRemoved > 0) {
        cacheTimes = cacheTimes.slice(numRemoved)
      }

      if (message.videoId in cache) {
        //agar videoID cache mei hai toh hum usko response me send kar denge
        sendResponse(cache[message.videoId])
        return
      }

      // agar videoID cache mei nahi hai toh hum ek API request bhejenge us videoID ke liye
      fetch('https://returnyoutubedislikeapi.com/Votes?videoId=' + message.videoId)
        .then(response => {
            //agar response nahi aaya toh hum null send kar denge
          if (!response.ok) {
            sendResponse(null)
          } 
          //agar agaya to likesData naam ka json object banayenge or likes ka data usme store karenge
          else {
            response.json().then(data => {
              const likesData = {
                'likes': data.likes,
                'dislikes': data.dislikes,
                'videoId': message.videoId,
                'type':"NEW",
                
              }
              //agar videoId nahi hai cache me to uske location me likesData store kar denge or cache time us paal ka denge
              if (!(message.videoId in cache)) {
                cache[message.videoId] = likesData
                cacheTimes.push([Date.now(), message.videoId])
              }
              sendResponse(likesData)
            })
          }
        })

      //hum true signal bhej rahe browser ko batane keliye ki hum async me response denge sendResponse use karke
      return true
//agar ye case hai to hum tab ke liye ek css file insert kar denge
    case 'insertCss':
      chrome.scripting.insertCSS({
        target: {
          tabId: sender.tab.id,
        },
        files: message.files,
      })
      break
//agar ye case hai to hum cacheDuration ko update kar denge
    case 'updateSettings':
      cacheDuration = message.cacheDuration
      break
  }
})