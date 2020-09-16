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

function switchButtons(isEditMode) {
    if (isEditMode) {
        $("#btn-start-editing").hide();
        $("#btn-add-new-card").show();
        $("#btn-finish-editing").show();
    } else {
        $("#btn-start-editing").show();
        $("#btn-add-new-card").hide();
        $("#btn-finish-editing").hide();
    }
}

function startEditing() {
    isEditMode = true;
    switchButtons(isEditMode);
    $("#my-job").addClass("my-job-edit");
}

function finishEditing() {
    isEditMode = false;
    switchButtons(isEditMode);
    $("#my-job").removeClass("my-job-edit");
    if (editCardId != null) {
        // если было добавленое новой карты, удалим
        if (editCardId == -1) {
            cards = cards.filter((x) => x.id != -1);
        }
        editCardId = null;
        renderJobCards();
    }
    saveChangesToLocalStorage();
}

function addNewCard() {
    // если какая-то карточка уже редактируется, запрещаем добавление
    if (editCardId != null) {
        return;
    }

    var newCard = {
        id: -1,
    };
    fieldNames.forEach((fieldName) => (newCard[fieldName] = ""));
    cards.push(newCard);

    // -1 означает что это новая карточка
    editCardId = -1;

    // обновить DOM
    renderJobCards();
}

// начать редактирование карточки с id=cardId
function editCard(cardId) {
    editCardId = cardId;
    renderJobCards();
}

// удаление карточки с id=cardId
function removeCard(cardId) {
    // добавляем изменение в массив
    changes.push({
        type: "remove",
        id: cardId,
    });

    // применяем изменение к текущему состоянию
    cards = cards.filter((x) => x.id != cardId);

    // обновить DOM
    renderJobCards();
}

// сохранить изменения в карточке с id=cardId
function saveChanges(cardId) {
    // обновленный объект карточки
    var updatedCard = {
        id: cardId,
    };
    fieldNames.forEach((fieldName) => {
        var value = $(`[data-card-id="${cardId}"] [name="${fieldName}"]`).val();
        updatedCard[fieldName] = value;
    });

    if (cardId == -1) {
        // это новая карточка. присвоить новый идентификатор
        maxCardId++;
        updatedCard.id = maxCardId;
    }

    // сохранить изменение в массив
    changes.push({
        type: cardId == -1 ? "add" : "edit",
        data: updatedCard,
    });    

    // подменяем редактируемую карту новой версией
    cards = cards.map((card) => {
        if (card.id != cardId) {
            return card;
        } else {
            return updatedCard;
        }
    });

    // редактирование завершено
    editCardId = null;

    // обновить DOM
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
    $("#cards").html(res);
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
    $("#btn-start-editing").click(startEditing);
    $("#btn-finish-editing").click(finishEditing);
    $("#btn-add-new-card").click(addNewCard);

    var response = await fetch("/data.json");
    var data = await response.json();
    initMaxCardId(data);
    cards = applyChangesFromLocalStorage(data);
    renderJobCards();
}

// инициализировать
function initMaxCardId(data) {
    let maxCardIdFromLocalStorage = localStorage.getItem("maxCardId");
    // если в localStorage еще нету этого значения, инициализируем по данным
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
                // удаляем элемент с id=change.id
                result = result.filter(x => x.id != change.id);
                break;
            case "add":
                result.push(change.data);
                break;
            case "edit":
                result = result.map(card => card.id == change.data.id ? change.data : card);
                break;
        }
    });

    return result;
}

function saveChangesToLocalStorage() {
    localStorage.setItem('maxCardId', maxCardId);
    localStorage.setItem('cardChanges', JSON.stringify(changes));
}

init();

