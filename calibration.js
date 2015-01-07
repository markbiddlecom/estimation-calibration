// State
var batches = [];
var batch = -1;

// Wire up UI events.
$("#btn-get-started").click(function() {
	$("#jumbotron").hide("fast");
	$("#questions-container").removeClass("hidden");
	prepareRound();
});

$("#btn-score").click(function() {
	var empty = false;
	$("#questions INPUT").each(function(i, e) {
		$e = $(e);
		if(!isValidNumberString($e.val())) {
			$e.parent().addClass("has-error");
			empty = true;
		} else {
			$e.parent().removeClass("has-error");
		}
	});
	if(!empty) {
		var stats = score(batches[batch], $("#questions .min-answer INPUT"), $("#questions .max-answer INPUT"));
		$("#questions .question").each(function(i, e) {
			var answer = stats.answers[i];
			var $question = $(e);

			$question.addClass(answer.correct ? "correct" : "incorrect");
			$question.find(".your-answer").html(
				formatAnswerNumber(answer.guess.min) +
				" to " + 
				formatAnswerNumber(answer.guess.max)
			);
		});

		$("#questions .result").hide().removeClass("hidden").show("fast");
		$("#questions .answer").hide("fast");

		var $note = null;
		if(stats.score < 0.9) { $note = $("#overconfident"); }
		else if(stats.score > 0.9) { $note = $("#underconfident"); }
		else { $note = $("#nice"); }

		$note.hide().removeClass("hidden").show("fast");
		$("#actions").hide().removeClass("hidden").show("fast");
		$("#btn-score").hide();
	}
});

$("#btn-next").click(function() {
	$("#actions, .note").hide("fast");
	prepareRound();
});

$(".answer INPUT").blur(function() {
	var $this = $(this);
	$this.val($this.val().replace(/\,/g, ""));

	if(!isValidNumberString($this.val())) {
		$this.parent().addClass("has-error");
	} else {
		$this.parent().removeClass("has-error");
	}
});

// Initialize
$(function() {
	// Load our question batches.
	var questions = loadQuestions();
	shuffle(questions.questions);
	for(var i = 0; i < questions.questions.length; i += 10) {
		var b = [];
		for(var j = i; j < i + 10; j++) {
			b.push(questions.questions[j]);
		}
		batches.push(b);
	}
});

// Helpers
function prepareRound() {
	batch++;

	if(batch >= batches.length) {
		allDone();
	}
	else {
		var srcCount = 1;
		var $questionsTable = $("#questions");
		var $questionTemplate = $("#question-template");
		$questionsTable.empty();
		$questionsTable.append($("#questions-header-template").clone().attr("id", ""));
		for(var i = 0; i < batches[batch].length; i++) {
			var $q = $($questionTemplate.clone(true, true).attr("id", ""));
			var q = batches[batch][i];
			$q.find(".question-text").html(q.q);
			$q.find(".correct-answer").html(formatAnswerNumber(q.a));

			$questionsTable.append($q);

			var srcHtml = "", src = q.src;
			if(typeof src === "string") { src = [ src ]; }
			for(var j = 0; j < src.length; j++) {
				if(srcHtml.length !== 0) { srcHtml += ", "; }
				srcHtml += "[" + "<a target='_blank' href='" + src [j]+ "'>" + (srcCount++) + "</a>]";
			}
			$q.find(".source").html(srcHtml);
		}
		$("#btn-score").show();
	}
}

function allDone() {
	$("#questions-container").hide("fast");
	$("#all-done").hide().removeClass("hidden").show("fast");
}

function shuffle(array) {
	for(var i = 0; i < array.length; i++) {
		var tmp = array[i];
		var j = Math.floor(Math.random() * array.length);
		array[i] = array[j];
		array[j] = tmp;
	}
	return array;
}

function score(questions, $aAnswers, $bAnswers) {
	var stats = { correct: 0, answers: [] };
	for(var i = 0; i < questions.length; i++) {
		var a = parseFloat($($aAnswers[i]).val());
		var b = parseFloat($($bAnswers[i]).val());
		answer(stats, questions[i], a, b);
	}
	stats.score = stats.correct / stats.answers.length;
	return stats;
}

function answer(stats, question, a, b) {
	var min = Math.min(a, b);
	var max = Math.max(a, b);
	var ans = {
		question: question,
		guess: { min: min, max: max },
		correct: min <= question.a && max >= question.a
	};
	stats.answers.push(ans);
	stats.answers.correct += ans.correct ? 1 : 0;
	return ans;
}

function formatAnswerNumber(number) {
	if("" + number === "" + Math.round(number)) {
		return formatNumber(number, ",0");
	}
	else {
		var count = ("" + number).replace(/^.*\./, "").length;
		var format = ",0.";
		for(var i = 0; i < count && i < 5; i++) { format += "0"; }
		return formatNumber(number, format);
	}
}

function isValidNumberString(n) {
	return /^[Ee0-9\,\.\+\-]+$/.test(n) && !isNaN(parseFloat(n));
}

/**
 * Formats a number according to a format specifier.
 * https://gist.github.com/markbiddlecom/5079340
 * 
 *   [LEFT][.RIGHT]
 *   LEFT := [,]0+
 *   RIGHT := 0+
 */
function formatNumber(number, format) {
    if(number === null || number === undefined) { return ""; }
    if(!(/^\+?(,?0+)?(\.0+)?$/.test(format))) { format = ",0.0"; }
    
    if(typeof number === "string") { number = parseFloat(number); }
    if(typeof number !== "number") { number = 0; }
    
    var alwaysSign = format.charAt(0) === '+';
    if(alwaysSign === true) { format = format.substring(1); }
    var digitGrouping = format.charAt(0) === ',';
    if(digitGrouping === true) { format = format.substring(1); }
    
    var left, right;
    var dotPos = format.indexOf(".");
    if(dotPos == -1) { left = format; right = ""; }
    else { left = format.substring(0, dotPos); right = format.substring(dotPos + 1); }
    
    if(right !== "") {
        var m = parseInt(padRight("1", "0", right.length + 1));
        number = Math.round(number * m) / m;
    }
    else {
        number = Math.round(number);
    }
    
    var sNumber = number.toString();
    if(sNumber.indexOf("e") !== -1) { return sNumber; } // unsupported
    
    var nLeft, nRight;
    dotPos = sNumber.indexOf(".");
    if(dotPos == -1) { nLeft = sNumber; nRight = ""; }
    else { nLeft = sNumber.substring(0, dotPos); nRight = sNumber.substring(dotPos + 1); }
    
    if(nLeft.charAt(0) === '-') { alwaysSign = true; nLeft = nLeft.substring(1); }
    if(nLeft.length < left.length) { nLeft = padLeft(nLeft, "0", left.length); }
    if(nRight.length < right.length) { nRight = padRight(nRight, "0", right.length); }
    
    if(digitGrouping === true) {
        for(var i = nLeft.length - 4; i >= 0; i -= 3) {
            nLeft = nLeft.substring(0, i + 1) + "," + nLeft.substring(i + 1);
        }
    }
    
    if(alwaysSign === true) { nLeft = (number < 0 ? "-" : "+") + nLeft; }
    if(right.length > 0) { nRight = "." + nRight; }
    
    return nLeft + nRight;
}

function padLeft(string, padCharacter, minLength) {
    if(string === null || string === undefined) { return string; }
    if(minLength === null || minLength === undefined) { minLength = 0; }
    else if(typeof minLength !== "number") { minLength = parseInt(minLength.toString()); }
    string += "";
    while(string.length < minLength) { string = padCharacter + string; }
    return string;
}
 
function padRight(string, padCharacter, minLength) {
    if(string === null || string === undefined) { return string; }
    if(minLength === null || minLength === undefined) { minLength = 0; }
    else if(typeof minLength !== "number") { minLength = parseInt(minLength.toString()); }
    string += "";
    while(string.length < minLength) { string += padCharacter; }
    return string;
}
