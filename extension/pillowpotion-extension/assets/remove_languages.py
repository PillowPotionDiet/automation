import re

filePath = 'index.html-B-tB0sk2.js'

print('Reading main bundle...')
with open(filePath, 'r', encoding='utf-8') as f:
    content = f.read()

originalSize = len(content)
print('Original file size: ' + str(originalSize) + ' characters')

print('\nRemoving language selector UI...')
languageSelectorPattern = r'language:\{label:\{t:0,b:\{t:2,i:\[\{t:3\}],s:"Language"\}\},description:\{t:0,b:\{t:2,i:\[\{t:3\}],s:"Select your preferred language"\}\},english:\{t:0,b:\{t:2,i:\[\{t:3\}],s:"English"\}\},vietnamese:\{t:0,b:\{t:2,i:\[\{t:3\}],s:"Ti\u1ebfng Vi\u1ec7t"\}\},chinese:\{t:0,b:\{t:2,i:\[\{t:3\}],s:"\u4e2d\u6587"\}\}\},'
content = re.sub(languageSelectorPattern, '', content)
print('Language selector UI removed')

print('\nSearching for Vietnamese language object...')
viStartPattern = ',{vi:{common:{'
viStartIndex = content.find(viStartPattern)

if viStartIndex == -1:
    print('Vietnamese language object not found')
else:
    print('Found Vietnamese object at index: ' + str(viStartIndex))
    braceCount = 0
    inString = False
    escapeNext = False
    viEndIndex = -1
    
    for i in range(viStartIndex + 1, len(content)):
        currentChar = content[i]
        
        if escapeNext:
            escapeNext = False
            continue
            
        if currentChar == chr(92):  # backslash
            escapeNext = True
            continue
            
        if currentChar == '"' and not escapeNext:
            inString = not inString
            continue
            
        if inString:
            continue
            
        if currentChar == '{':
            braceCount = braceCount + 1
        elif currentChar == '}':
            braceCount = braceCount - 1
            if braceCount == 0:
                afterClose = content[i+1:i+20]
                if afterClose.startswith(',{zh:{'):
                    continue
                else:
                    viEndIndex = i + 1
                    break
    
    if viEndIndex == -1:
        print('Could not find end of language objects')
        exit(1)
    
    charsRemoved = viEndIndex - viStartIndex
    print('Found end at index: ' + str(viEndIndex))
    print('Removing ' + str(charsRemoved) + ' characters')
    
    newContent = content[:viStartIndex] + content[viEndIndex:]
    newSize = len(newContent)
    
    print('New file size: ' + str(newSize) + ' characters')
    print('Removed: ' + str(originalSize - newSize) + ' characters')
    
    with open(filePath, 'w', encoding='utf-8') as f:
        f.write(newContent)
    
    print('\nLanguage objects removed successfully!')
