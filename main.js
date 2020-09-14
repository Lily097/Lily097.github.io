// режим редактирования
var isEditMode = false;

// массив с данными карточек
var cards = [];

// массив с историей изменений
var changes = [];

// id редактируемой карты
var editCardId = null;

var maxCardId = 0;

var fieldNames = [
    "occupation",
    "responsibilities",
    "startDate",
    "endDate"
];

function switchButtons(isEditMode) {
    if (isEditMode) {
        $('#btn-start-editing').hide();        
        $('#btn-add-new-card').show();
        $('#btn-finish-editing').show();
    } else {
        $('#btn-start-editing').show();        
        $('#btn-add-new-card').hide();
        $('#btn-finish-editing').hide();
    }
}

function startEditing() {
    isEditMode = true;
    switchButtons(isEditMode);
    $('#my-job').addClass('my-job-edit');
}

function finishEditing() {
    isEditMode = false;
    switchButtons(isEditMode);
    $('#my-job').removeClass('my-job-edit');
    if (editCardId != null) {
        // если было добавленое новой карты, удалим
        if (editCardId == -1) {
            cards = cards.filter(x => x.id != -1);
        }
        editCardId = null;
        renderJobCards();
    }
}

function addNewCard() {
    // если какая-то карточка уже редактируется, запрещаем добавление
    if (editCardId != null) {
        return;
    }

    var newCard = {
        id: -1
    };
    fieldNames.forEach(fieldName => newCard[fieldName] = '');
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
        "type": "remove",
        "id": cardId
    });

    // TODO сохранить массив изменений в localStorage
    
    // применяем изменение к текущему состоянию
    cards = cards.filter(x => x.id != cardId);
    
    // обновить DOM
    renderJobCards();
}

// сохранить изменения в карточке с id=cardId
function saveChanges(cardId) {
    // обновленный объект карточки
    var updatedCard = {
        id: cardId
    };
    fieldNames.forEach(fieldName => {
        var value = $(`[data-card-id="${cardId}"] [name="${fieldName}"]`).val();
        updatedCard[fieldName] = value;
    });

    if (cardId == -1) {
        // это новая карточка. присвоить новый идентификатор
        maxCardId++;
        // TODO сохранить в localStorage
        updatedCard.id = maxCardId;
    }

    // подменяем редактируемую карту новой версией
    cards = cards.map(card => {
        if (card.id != cardId) {
            return card;
        } else {
            return updatedCard;
        }
    });

    // сохранить изменение в массив
    changes.push({
        ...updatedCard,
        type: 'edit'
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
        cards = cards.filter(x => x.id != -1);
    }
    editCardId = null;
    renderJobCards();
}

// обновить карточки
function renderJobCards() {
    console.log(cards);
    var res = "";
    cards.forEach((job) => {
        if (job.id == editCardId) {
            res += renderJobCardEdit(job);
        } else {
            res += renderJobCard(job);
        }
    });
    //console.log(res);
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

function init() {
    $('#btn-start-editing').click(startEditing);
    $('#btn-finish-editing').click(finishEditing);
    $('#btn-add-new-card').click(addNewCard);

    fetch("/data.json")
        .then((resp) => resp.json())
        .then((data) => {
            cards = data;
            var ids = cards.map(x => x.id);
            var maxIdFromData = Math.max.apply(null, ids);
            maxCardId = Math.max(maxCardId, maxIdFromData);
            // TODO сохранить/прочитать maxCardId из localStorage
            // TODO подмешать изменения из localStorage
            renderJobCards();
        });
}

init();
