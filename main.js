// режим редактирования
var isEditMode = false;

// массив с данными карточек
var cards = [];

// массив с историей изменений
var changes = [];

// id редактируемой карты
var editCardId = null;

var maxCardId = 0;

var fieldNames = ["occupation", "responsibilities", "startDate", "endDate"];

var btnStartEditing = document.getElementById("btn-start-editing");
var btnAddNewCard = document.getElementById("btn-add-new-card");
var btnFinishEditing = document.getElementById("btn-finish-editing");
    
function switchButtons(isEditMode) {
    if (isEditMode) {
        btnStartEditing.style.display = "none";
        btnAddNewCard.style.display = "inline-block";
        btnFinishEditing.style.display = "inline-block";
    } else {
        btnStartEditing.style.display = "inline-block";
        btnAddNewCard.style.display = "none";
        btnFinishEditing.style.display = "none";
    }
}

var myJob = document.getElementById("my-job");

function startEditing() {
    isEditMode = true;
    switchButtons(isEditMode)   
    myJob.classList.add("my-job-edit"); 
}

function finishEditing() { 
    isEditMode = false;
    switchButtons(isEditMode);
    myJob.classList.remove("my-job-edit");
    if (editCardId != null) {
        // если было добавленое новой карты, удалить
        if (editCardId == -1) {
            cards = cards.filter((x) => x.id != -1);
        }
        editCardId = null;
        renderJobCards(); //Обновление карточки
    }
    saveChangesToLocalStorage();
}

function addNewCard() {
    // если какая-то карточка уже редактируется, запретить добавление новых карточек
    if (editCardId != null) {
        return;
    }
    var newCard = {
        id: -1,
    }
    fieldNames.forEach((fieldName)=> (newCard[fieldName] = ""));
    cards.push(newCard);

        // -1 - id новой  карточки
    editCardId = -1;

        
    renderJobCards();
}

// начать редактирование карточки с id=cardId
function editCard(cardId) {
    editCardId = cardId;
    renderJobCards();
}

// удаление карточки с id=cardId
function removeCard(cardId) {
    // добавить изменение в массив
    changes.push({
        type: "remove",
        id: cardId,
    });

    // применить изменение к текущему состоянию
    cards = cards.filter((x) => x.id != cardId);
    
    renderJobCards();
}

// сохранить изменения в карточке с id = cardId
function saveChanges(cardId) {
    // обновленный объект карточки
    var updatedCard = {
        id: cardId,
    };
    var card = document.querySelector(`[data-card-id="${cardId}"]`);
    fieldNames.forEach((fieldName) => {
        var field = card.querySelector(`[name="${fieldName}"]`);
        updatedCard[fieldName] = field.value;
    });

    if (cardId == -1) {
        // новая карточка. Присвоить новый идентификатор
        maxCardId++;
        updatedCard.id = maxCardId;
    }

    // сохранить изменение в массив
    changes.push({
        type: cardId == -1 ? "add" : "edit",
        data: updatedCard,
    });

    // подменить редактируемую карту новой версией
    cards = cards.map((card) => {
        if (card.id != cardId) {
            return card;
        } else {
            return updatedCard;
        }
    });

    // редактирование завершено
    editCardId = null;
   
    renderJobCards();
}

// отменить внесение изменений в карточку с id=cardId
function cancelAddEditCard(cardId) {
    if (editCardId == -1) {
        // новая карточка не была сохранена - удалить ее из массива
        cards = cards.filter((x) => x.id != -1);
    }
    editCardId = null;
    renderJobCards();
}

// обновить карточки
function renderJobCards() {
    var res = "";
    cards.forEach((job) => {
        if (job.id == editCardId) {
            res += renderJobCardEdit(job);
        } else {
            res += renderJobCard(job);
        }
    });
    document.getElementById("cards").innerHTML = res;
}

function renderJobCard(card) {
    return `
    <div class="my-job__card" data-card-id="${card.id}">
        <div class="my-job__card__buttons">      
            <button class="button icon-edit" onclick="editCard(${card.id})"></button>                                    
            <button class="button icon-delete" onclick="removeCard(${card.id})"></button>                                
        </div>
        <div class="my-job__card__text">
            <div>${card.occupation}</div>
            <div>${card.responsibilities}</div>
            <div>${card.startDate}</div>
            <div>${card.endDate}</div>
        </div>
    </div>`;
}

function renderJobCardEdit(card) {
    return `
    <div class="my-job__card" data-card-id="${card.id}">
        <div class="my-job__card__buttons">
            <button class="button icon-save" onclick="saveChanges(${card.id})"></button>
            <button class="button icon-delete" onclick="cancelAddEditCard(${card.id})"></button>                
        </div>
        <div class="my-job__card__text">
            <div>
                <input type="text" placeholder="Должность" name="occupation" value="${card.occupation}"/>
            </div>
            <div>
                <textarea placeholder="Обязанности" name="responsibilities">${card.responsibilities}</textarea>
            </div>
            <div>
                <input type="text" placeholder="Начало работы" name="startDate" value="${card.startDate}"/>
            </div>
            <div>
                <input type="text" placeholder="Конец работы" name="endDate" value="${card.endDate}"/>
            </div>
        </div>
    </div>`;
}

async function init() {
    btnStartEditing.addEventListener("click", startEditing);
    btnFinishEditing.addEventListener("click", finishEditing);
    btnAddNewCard.addEventListener("click", addNewCard);

    var response = await fetch("/data.json");
    var data = await response.json();
    initMaxCardId(data);
    cards = applyChangesFromLocalStorage(data);
    renderJobCards();
}

// инициализировать
function initMaxCardId(data) {
    let maxCardIdFromLocalStorage = localStorage.getItem("maxCardId");
    // если в localStorage еще нет этого значения, инициализировать по данным
    if (!maxCardIdFromLocalStorage) {
        let ids = data.map((x) => x.id);
        let maxCardIdFromData = Math.max.apply(null, ids);
        maxCardId = maxCardIdFromData;
    } else {
        maxCardId = maxCardIdFromLocalStorage;
    }
}

function applyChangesFromLocalStorage(data) {
    let changesFromLocalStorage = localStorage.getItem("cardChanges");
    if (!changesFromLocalStorage) {
        return data;
    }

    changes = JSON.parse(changesFromLocalStorage);

    var result = data;
    changes.forEach((change) => {
        switch (change.type) {
            case "remove":
                // удалить элемент с id = change.id
                result = result.filter((x) => x.id != change.id);
                break;
            case "add":
                result.push(change.data);
                break;
            case "edit":
                result = result.map((card) =>
                    card.id == change.data.id ? change.data : card
                );
                break;
        }
    });

    return result;
}

function saveChangesToLocalStorage() {
    localStorage.setItem("maxCardId", maxCardId);
    localStorage.setItem("cardChanges", JSON.stringify(changes));
}

init();

