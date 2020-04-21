PDFJS.reader.SearchController = function () {

    var reader = this,
        book = this.book;

    var $searchBox = $("#searchBox"),
        $clearBtn = $("#searchBox").next(),
        $clear_search = $("#clear_search"),
        $searchResults = $("#searchResults"),
        $searchView = $("#searchView"),
        $body = $("#viewer iframe").contents().find('body'),
        $sidebar = $("#sidebar"),
        $match_count = $("#match_count");

    /* search logic, partly from Mozilla pdfViewer */
    var CHARACTERS_TO_NORMALIZE = {
        '\u2018': '\'', // Left single quotation mark
        '\u2019': '\'', // Right single quotation mark
        '\u201A': '\'', // Single low-9 quotation mark
        '\u201B': '\'', // Single high-reversed-9 quotation mark
        '\u201C': '"', // Left double quotation mark
        '\u201D': '"', // Right double quotation mark
        '\u201E': '"', // Double low-9 quotation mark
        '\u201F': '"', // Double high-reversed-9 quotation mark
        '\u00BC': '1/4', // Vulgar fraction one quarter
        '\u00BD': '1/2', // Vulgar fraction one half
        '\u00BE': '3/4', // Vulgar fraction three quarters
    };

	var startedTextExtraction = false,
		extractTextPromises = [],
        matchCount = 0,
		pendingFindMatches = Object.create(null);

    // Compile the regular expression for text normalization once.
    var replace = Object.keys(CHARACTERS_TO_NORMALIZE).join(''),
		normalizationRegex = new RegExp('[' + replace + ']', 'g');

    var reset = function () {

        pendingFindMatches = Object.create(null);
        reader.search_active = false; // If active, find results will be highlighted.
        reader.pageMatches.length = 0;
        reader.pageMatchesLength = null;
        reader.search_state = null;
        matchCount = 0;
        resetMatchCounter();
        reader.selected = { // Currently selected match.
            pageIdx: -1,
            matchIdx: -1,
            at_start: false,
            at_end: false
        };
        updatePage();
    };

    var normalize = function (text) {
        return text.replace(normalizationRegex, function (ch) {
            return CHARACTERS_TO_NORMALIZE[ch];
        });
    };

    // Helper for multiple search - fills matchesWithLength array
    // and takes into account cases when one search term
    // include another search term (for example, "tamed tame" or "this is").
    // Looking for intersecting terms in the 'matches' and
    // leave elements with a longer match-length.

    var _prepareMatches = function (
        matchesWithLength, matches, matchesLength) {

            function isSubTerm(matchesWithLength, currentIndex) {
                var currentElem, prevElem, nextElem;
                currentElem = matchesWithLength[currentIndex];
                nextElem = matchesWithLength[currentIndex + 1];
                // checking for cases like "TAMEd TAME"
                if (currentIndex < matchesWithLength.length - 1 &&
                    currentElem.match === nextElem.match) {
                        currentElem.skipped = true;
                        return true;
                    }
                // checking for cases like "thIS IS"
                for (var i = currentIndex - 1; i >= 0; i--) {
                    prevElem = matchesWithLength[i];
                    if (prevElem.skipped) {
                        continue;
                    }
                    if (prevElem.match + prevElem.matchLength < currentElem.match) {
                        break;
                    }
                    if (prevElem.match + prevElem.matchLength >=
                        currentElem.match + currentElem.matchLength) {
                            currentElem.skipped = true;
                            return true;
                        }
                }
                return false;
            }

            var i, len;
            // Sorting array of objects { match: <match>, matchLength: <matchLength> }
            // in increasing index first and then the lengths.
            matchesWithLength.sort(function(a, b) {
                return a.match === b.match ?
                    a.matchLength - b.matchLength : a.match - b.match;
            });
            for (i = 0, len = matchesWithLength.length; i < len; i++) {
                if (isSubTerm(matchesWithLength, i)) {
                    continue;
                }
                matches.push(matchesWithLength[i].match);
                matchesLength.push(matchesWithLength[i].matchLength);
            }
        };

    var calcFindPhraseMatch = function (
        query, pageIndex, pageContent) {
            var matches = [];
            var queryLen = query.length;
            var matchIdx = -queryLen;
            while (true) {
                matchIdx = pageContent.indexOf(query, matchIdx + queryLen);
                if (matchIdx === -1) {
                    break;
                }
                matches.push(matchIdx);
            }
            reader.pageMatches[pageIndex] = matches;

        };

    var calcFindWordMatch = function (
        query, pageIndex, pageContent) {
            var matchesWithLength = [];
            // Divide the query into pieces and search for text on each piece.
            var queryArray = query.match(/\S+/g);
            var subquery, subqueryLen, matchIdx;
            for (var i = 0, len = queryArray.length; i < len; i++) {
                subquery = queryArray[i];
                subqueryLen = subquery.length;
                matchIdx = -subqueryLen;
                while (true) {
                    matchIdx = pageContent.indexOf(subquery, matchIdx + subqueryLen);
                    if (matchIdx === -1) {
                        break;
                    }
                    // Other searches do not, so we store the length.
                    matchesWithLength.push({
                        match: matchIdx,
                        matchLength: subqueryLen,
                        skipped: false
                    });
                }
            }
            // Prepare arrays for store the matches.
            if (!reader.pageMatchesLength) {
                reader.pageMatchesLength = [];
            }
            reader.pageMatchesLength[pageIndex] = [];
            reader.pageMatches[pageIndex] = [];
            // Sort matchesWithLength, clean up intersecting terms
            // and put the result into the two arrays.
            _prepareMatches(matchesWithLength, reader.pageMatches[pageIndex],
                reader.pageMatchesLength[pageIndex]);

        };

    var getSnippet = function (pageIndex, position) {

        var ellipse = '…',
            match_length = reader.search_state.query.length,
            span = '<span class="search_match">',
            span_close = '</span>',
            limit = 160 + span.length + span_close.length,
            leader,
            trailer,
            context;

        leader = reader.pageContents[pageIndex].substring(position - limit/2, position);
        leader = leader.slice(leader.indexOf(" "));
        trailer = reader.pageContents[pageIndex].substring(position + match_length, position + limit/2 + match_length);
        query = reader.pageContents[pageIndex].substring(position, position + match_length);

        context = ellipse + leader + span + query + span_close + trailer;

        return reader.ellipsize(context, context.length - 10);
    };

    var createItem = function (pageIndex, position) {

        var listitem = document.createElement("li"),
            link = document.createElement("a"),
            item = {
                url: null,
                dest: null,
                bold: null,
                italic: null
            };

        // for now only the pageIndex is used
        item.dest = [pageIndex,position];

        //link.textContent = getSnippet(pageIndex, position);
        listitem.dataset.index = ++matchCount;
        link.innerHTML = '<span class="match_label">' + matchCount + '</span>' + getSnippet(pageIndex, position);
        listitem.classList.add("list_item");
        reader.bindLink(link, item);
        link.classList.add("search_link");
        listitem.appendChild(link);

        return listitem;
    };

    var createItemList = function (pageIdx) {

        var currentIdx = reader.settings.currentPage - 1,
            item,
            i = 0;

        // currentIdx can be up to 2 different from pageIdx due to oddPageFirst and spread rendering
        if (Math.abs(pageIdx - currentIdx) <= 2)
            updatePage(pageIdx);
        var fragment = document.createDocumentFragment();
        var listitem = document.createElement("li");
        listitem.textContent="page " + parseInt(pageIdx + 1);
        listitem.classList.add("search_page_header");
        fragment.appendChild(listitem);
        reader.pageMatches[pageIdx].forEach(function (match) {
            item = createItem(pageIdx, match);
            item.id = "match:" + pageIdx + ":" + i;
            item.classList.add("match:" + pageIdx + ":" + i++);
            fragment.appendChild(item);
			updateMatchCounter();
        });

        return fragment;
    };

    var calcFindMatch = function (pageIndex) {
        var pageContent = normalize(reader.pageContents[pageIndex]);
        var query = normalize(reader.search_state.query);
        var caseSensitive = reader.search_state.caseSensitive;
        var phraseSearch = reader.search_state.phraseSearch;
        var queryLen = query.length;

        if (queryLen === 0) {
            reset();
            return;
        }

        if (!caseSensitive) {
            pageContent = pageContent.toLowerCase();
            query = query.toLowerCase();
        }

        if (phraseSearch) {
            calcFindPhraseMatch(query, pageIndex, pageContent);
        } else {
            calcFindWordMatch(query, pageIndex, pageContent);
        }
    };

    var extractText = function () {

        if (startedTextExtraction) {
            return;
        }
        startedTextExtraction = true;

        reader.pageContents = [];
        var extractTextPromisesResolves = [];
        var numPages = reader.settings.numPages;

        for (var i = 0; i < numPages; i++) {
            extractTextPromises.push(new Promise(function (resolve) {
                extractTextPromisesResolves.push(resolve);
            }));
        }

        function extractPageText(pageIndex) {
            reader.getPageTextContent(pageIndex).then(
                function textContentResolved(textContent) {
                    reader.ControlsController.setStatus("extracting text page " + parseInt(pageIndex + 1),true);
                    var textItems = textContent.items;
                    var str = [];

                    for (var i = 0, len = textItems.length; i < len; i++) {
                        str.push(textItems[i].str);
                    }

                    // Store the pageContent as a string.
                    reader.pageContents.push(str.join(''));

                    extractTextPromisesResolves[pageIndex](pageIndex);
                    if ((pageIndex + 1) < reader.settings.numPages) {
                        extractPageText(pageIndex + 1);
                    } 
                }
            );
        }
        extractPageText(0);
    };

    var updatePage = function (pageIdx) {

        var pageNum = (pageIdx) ? pageIdx + 1 : null;

        if (reader.resourcelst) {

            reader.resourcelst.forEach(function(list) {

                if (list.textLayer && (pageNum === list.pageNum || pageNum === null)) {
                    list.textLayer.updateMatches();
                }
            });
        }
    };

    var executeCommand = function (cmd, state) {

        reader.search_state = state;

        reader.firstPagePromise.then(function() {
            if (reader.pageContents.length < reader.settings.numPages) 
                extractText();

            if (cmd === 'find') {
                reader.search_active = true;
                $match_count.show();
                generateMatchList();
            } 
        }.bind(this));
    };

    var generateMatchList = function () {

        var container = document.getElementById("searchResults"),
            numPages = reader.settings.numPages,
            currentIdx = reader.settings.currentPage - 1,
            i;

        if (reader.pageContents.length !== numPages) {
            extractText();
            for (i = 0; i < numPages; i++) {
                if (!(i in pendingFindMatches)) {
                    pendingFindMatches[i] = true;
                    extractTextPromises[i].then(function(pageIdx) {
                        delete pendingFindMatches[pageIdx];
                        calcFindMatch(pageIdx);
                        if (reader.pageMatches[pageIdx].length > 0) {
                            container.appendChild(createItemList(pageIdx));
                        }
                    });
                }
            }
        } else {
            for (i = 0; i < numPages; i++) {
                calcFindMatch(i);
                if (reader.pageMatches[i].length > 0) {
                    container.appendChild(createItemList(i));
                }
            }
        }
    };

    var nextMatch = function (previous) {

        /* don't try to follow non-existing matches */
        if (!reader.search_active ||
            reader.pageMatches.length === 0)
            return;

        var numPages = reader.settings.numPages,
            selected = reader.selected,
            leftIdx = idxOrNull(reader.resourcelst[0].pageNum),
            rightIdx = idxOrNull(reader.resourcelst[1].pageNum),
            try_match = false;

        /* prevent match cycling on first or last page */
        if (!((previous && selected.at_start) || (!previous && selected.at_end)))  {

            selected.at_start = selected.at_end = false;

            /*  when in spread view, start at left (forward search) or right (backward search) page
             *  if not iterating over matches on currently visible pages
             */
            if (!(selected.matchIdx !== -1 && isVisible(selected.pageIdx))) {
                if (previous) {
                    selected.pageIdx = (typeof rightIdx === "number") ? rightIdx : leftIdx;
                } else {
                    selected.pageIdx = (typeof leftIdx === "number") ? leftIdx : rightIdx;
                }
                try_match = true;

            } else  {

                var numPageMatches = reader.pageMatches[selected.pageIdx].length;

                if ((!previous && selected.matchIdx + 1 < numPageMatches) || (previous && selected.matchIdx > 0)) {
                    selected.matchIdx = (previous ? selected.matchIdx - 1 : selected.matchIdx + 1);
                    updateOrQueue();
                    return;
                } else {
                    selected.pageIdx += (previous) ? -1 : 1;
                    try_match = true;
                }
            }
        }

        if (try_match && nextPageMatch(previous)) {
            updateOrQueue();
            return;
        } else {
            if (previous) {
                reader.ControlsController.setStatus("at first match", true);
                selected.at_start = true;
            } else {
                reader.ControlsController.setStatus("at last match", true);
                selected.at_end = true;
            }
            return;
        }

        function idxOrNull(num) {

            if (typeof num === "number") {
                return num - 1;
            } else {
                return null;
            }
        }

        function isVisible (idx) {
            return (idx === leftIdx || idx === rightIdx);
        }

        function nextPageMatch (previous) {

            var i,
                found;

            if (previous) {
                for (i = selected.pageIdx; i >= -1 && reader.pageMatches[i] === undefined; i--) {}
            } else {
                for (i = selected.pageIdx; i <= numPages && reader.pageMatches[i] === undefined; i++) {}
            }

            if (i < 0 || i >= numPages) {
                i = -1;
                //selected.pageIdx = selected.matchIdx = -1;
                selected.matchIdx = -1;
                found = false;
            } else {
                selected.pageIdx = i;
                selected.matchIdx = (previous) ? reader.pageMatches[i].length - 1 : 0;
                found = true;
            }

            return found;
        }

        function updateOrQueue() {

            var root = document.getElementById("searchResults"),
                item,
                match,
                matchlist,
                i;

            item = root.getElementsByClassName("selected");
            while (item.length)
                item[0].classList.remove("selected");

            match = document.getElementById("match:" + selected.pageIdx + ":" + selected.matchIdx);
            match.classList.add("selected");

            updateMatchCounter(match.dataset.index);

            //matchlist = document.getElementsByClassName("match:" + selected.pageIdx + ":" + selected.matchIdx);
            //for (i = 0; i < matchlist.length; i++)
            //    matchlist[i].classList.add("selected_again");

            if (!reader.isVisible(match))
                match.scrollIntoView();

            if (isVisible(selected.pageIdx)) {
                [ leftIdx, rightIdx ].forEach(function (idx) {
                    if (typeof idx === "number") updatePage(idx);
                });
            } else {
                reader.queuePage(selected.pageIdx + 1);
            }
        }
    };

    var updateMatchCounter = function (index) {

        var prefix = "";

        if (index)
            prefix = index + "/";

        $match_count[0].textContent = prefix + matchCount;
    };

    var resetMatchCounter = function () {
        $match_count[0].textContent = "0";
        $match_count.hide();
    };

    var search = function(q) {
        if (q === undefined) {
            q = $searchBox.val();
        }

        if (q === '') {
            clear();
            return;
        }

        reader.SidebarController.changePanelTo("Search");

        reset();
        $searchResults.empty();

		executeCommand('find', {query: q});
    };

    $searchBox.on("keydown", function(e) {
        // Show the clear button if text input value is not empty
        $clearBtn.css("visibility", (this.value.length) ? "visible" : "hidden");

        // run search when Enter is pressed
        if (e.keyCode === 13) {
            search();
        }

        e.stopPropagation();
    });

    $clearBtn.on("click", function() {
        $(this).css("visibility", "hidden");
        $searchBox.val("");
    });

    $clear_search.on("click", function () {
        reset();
        $searchResults.empty();
        $searchBox.val("");
    });

    var clear = function () {

        reset();
        $searchResults.empty();

        if (reader.SidebarController.getActivePanel() == "Search") {
            reader.SidebarController.changePanelTo("Toc");
        }
    };

    // initialize search
    reset();

    if (reader.settings.preloadTextcontent) {
        reader.firstPagePromise.then(function() {
            setTimeout(function() {
                extractText();
            }, 5000);
        });
    }

    var onShow = function() {
        $searchView.addClass("open");
        $searchBox.focus();
    };

    var onHide = function() {
        $searchView.removeClass("open");
    };


    return {
        "show": onShow,
        "hide": onHide,
        "search": search,
        "executeCommand": executeCommand,
        "nextMatch": nextMatch

    };
};
