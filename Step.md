1. Fix form field alignment inconsistency.

Problem:
The "Industry" field and "Target Customer" field are visually misaligned.

Tasks:

* normalize all form field wrappers
* ensure labels, descriptions, and inputs share consistent spacing
* align vertically using the same layout structure
* use equal min-height for descriptions
* maintain responsive behavior

Goal:
Make all input fields visually consistent and aligned.

2. Refactor AI tool selection.

Problem:
The form still shows too many AI tools.

Tasks:

* limit AI choices to only:

  * ChatGPT
  * Gemini
  * No preference
* remove all other tools
* simplify selection UI
* update internal recommendation logic accordingly

Goal:
Reduce choice overload and match MVP scope.


3. 