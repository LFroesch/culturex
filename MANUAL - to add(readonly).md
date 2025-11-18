Better Logging / Monitoring
git
Options instead of comma-separated
better themeing
test apis etc / test / spoof data
tests
better feeds / following / etc / users etc / safety focused
better UI
better exploring in each city etc
search doesnt work
better UX when creating posts / messages etc
favicon
better news aggregation

language overhaul:
> can we specify the language the map is shown in/that the website is written in? for example if your setting is English it shows everything in english or japanese if 
you put japanese? 

● Yes! We can add internationalization (i18n) support. This would involve:

  1. Translation system for UI text (buttons, labels, messages)
  2. Language preference stored in user settings
  3. Map labels in the selected language
  4. Dynamic content (user posts, etc.) could stay in original language or be translated

  Let me check what you'd like to prioritize:
● User answered Claude's questions:                                                                                                                                
  ⎿  · What level of internationalization do you want to implement? → Full system
     · Which languages should we support initially? → I mean i feel like i need a lot, but obviously this is a large undertaking, can we more set it up modularly ?

● Perfect! Let's set up a modular i18n system that's easy to expand. I'll use react-i18next which is the standard for React apps. We'll start with English as the base
  and make it super easy to add more languages later.

● Bash(cd /home/lucas/projects/active/daily_use/culturalexchangeapp/client && npm install i18next react-i18next i18next-browser-languagedetector) timeout: 1m 0s
  ⎿  added 7 packages, and audited 221 packages in 2s

     42 packages are looking for funding
     … +8 lines (ctrl+o to expand)
  ⎿  Session limit reached ∙ resets 4pm
     /upgrade to increase your usage limit.

  Todos
  ☐ Install i18next dependencies
  ☐ Set up i18n configuration and folder structure
  ☐ Create English translation file as template
  ☐ Add language switcher component
  ☐ Update a sample component to use translations
  ☐ Add language preference to user settings