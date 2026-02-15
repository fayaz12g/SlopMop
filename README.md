# SlopMop
AI assisted web extension to mop up the slop and misinformation in your browser!

## Inspiration
Everywhere you go online you're bound to find some sort of misinformation, malicious actors breaching privacy, or AI content. It's hard to constantly fact check what's real and what's safe, which is why we built SlopMop, a simple browser extension you can install to solve this problem.

## What it does
SlopMop scans any active webpage and then displays overlays highlighting various aspects, broken down into AI generated content, misinformation, malicious content, or trackers. The user can hover over each element to see the perceived confidence that the element falls into this category, alongside an explanation.  This let's users think before they click, and hear a voice of reason before believing everything you read.

## How we built it
The project started as a simple extension that would look through the entire webpage, and detect certain strings-- specifically, anything containing the words "malware" or "track". If these were detected, the user was warned with an overlay that unsafe content was detected. This proof of concept was exciting, as we now had a way to highlight dangerous things on our screen.

Next, we worked on implementing real categorization. We integrated Gemini's API, and kept updating the system prompt. We worked with a modular approach, constantly iterating and testing to see what would yield the best response.

Then, we polished the front end. We created settings to be configured in the extension, as well as a clean usable user interface for the descriptions and overlays.

## Challenges we ran into
We began by using the API for Gemini 3 Pro, passing the document over and returning a JSON object containing a list of unsafe document IDs alongside their classification. The issue, however, was that this burned through many tokens quickly.

We stepped down to a cheaper model, Gemini 2.5 Flash, which still maintained good accuracy while running cheaper and faster. While this was less ideal for some of the advanced features we initially used for AI detection, we were able to rewire parts of our code base to handle this content more efficiently. 

## Accomplishments that we're proud of
The biggest accomplishment we are proud of is the use of the TwelveLabs API to get video analysis working. We implemented a feature that can detect whether a video may have been AI generated to warn the user in this case. As technology evolves, this will be more and more important, as it becomes hard to tell fact from fiction.

In the end, we've created a very impressive browser extension that is easy to use, and extremely useful to the end user. We're proud of the end product working fully as intended.

## What we learned
Ultimately, we all learned a lot about creating browser extensions. Some of us have never used JavaScript before, but we were all able to contribute meaningfully. We also think we did a great job as a team. We entered this as total strangers with no idea what we would be doing or who we would be doing it with, but through a collaborative environment were able to build an awesome project alongside friendships and having shared fun moments. 

## What's next for SlopMop
Preparing SlopMop for the world's stage, we'd love to utilize better AI models that can use reasoning before making categorical decisions, include a stronger AI analysis feature for text articles, and package the extension in a simple downloadable file that works on many more browsers. A chrome extension store release for the project could come soon, and we'd love to continue development on this as a product that helps users stay informed in this heavily evolving digital landscape.
