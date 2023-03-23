const ErrInternalServerError = new Error("Internal server error, please try again later.")
const ErrBadRequest = new Error("We're sorry, but Hacker News Summarizer was unable to produce a summary for this article.")

const getSummaryFromAPI = async (hnId) => {
    hnId = Number(hnId);
    if (hnId === NaN || hnId < 1) {
        throw ErrBadRequest;
    }

    const apiUrl = `https://hn.synopze.com/prod/?id=${hnId}`;

    return await fetch(apiUrl).then((response) => {
        if (response.status === 500) {
            throw ErrInternalServerError;
        }

        if (response.status === 400) {
            throw ErrBadRequest;
        }

        return response.json()
    }).then((data) => {
        if (!data) {
            return "Something went wrong";
        }

        if (data.error) {
            return data.error;
        }

        if (data.message) {
            return data.message;
        }

        if (data.summaries && data.summaries.length > 0) {
            return nl2br(data.summaries[0].summary);
        }

        return JSON.stringify(data);
    }).catch((error) => {
        return error
    })
}

const nl2br = (str, replaceMode, isXhtml) => {
    var breakTag = (isXhtml) ? '<br />' : '<br>';
    var replaceStr = (replaceMode) ? '$1' + breakTag : '$1' + breakTag + '$2';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, replaceStr);
}

const addSummarizeLinks = () => {
    const sublines = document.querySelectorAll('.subline');
    sublines.forEach(subline => {
        subline.innerHTML += '<span>|&nbsp;<a class="hn-summarizer--summary-link" href="#">summary</a></span>';
    });

    document.addEventListener('click', function (event) {
        if (!event.target.matches('.hn-summarizer--summary-link')) {
            return;
        }

        event.preventDefault();

        toggleLinkText(event.target);
        getSummaryAndDisplay(event.target);
    });
}

const toggleLinkText = (target) => {
    if (target.innerText === "summary") {
        target.innerText = "hide summary";
    } else {
        target.innerText = "summary";
    }
}

const getSummaryAndDisplay = (target) => {
    const hnId = target
        .closest('.subline')
        .getElementsByClassName('score')[0]
        .id
        .replace('score_', '');

    const targetRow = document.getElementById("hn-summarizer--col-" + hnId)
    if (targetRow && targetRow.innerText !== "") {
        showText("", hnId);
        return;
    }

    createSummaryRow(hnId);

    showText("Loading...", hnId);

    getSummaryFromAPI(hnId)
        .then((summary) => {
            showText(summary, hnId)
        })
        .catch((error) => console.log(error));
}

const createSummaryRow = (targetID) => {
    const targetEl = document.getElementById(targetID);

    const newElement = document.createElement("tr");
    newElement.innerHTML = `<td colspan="2"></td><td id="hn-summarizer--col-${targetID}"></td>`;
    targetEl.nextSibling.insertAdjacentElement("afterend", newElement);
}

const showText = (text, hnId) => {
    document.getElementById("hn-summarizer--col-" + hnId).innerHTML = text;
}

addSummarizeLinks();
