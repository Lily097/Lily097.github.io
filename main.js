// режим редактирования
var isEditMode = false;

// массив с данными карточек
var cards = [];

// id редактируемой карты
var editCardId = null;

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

function editCard(cardId) {
    editCardId = cardId;
    renderJobCards();
}

function removeCard(cardId) {
    console.log(cardId);
}

function saveChanges(cardId) {

}

function cancelAddEditCard(card) {

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
    console.log(res);
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
    $('#btn-start-editing').click(() => {
        isEditMode = true;
        switchButtons(isEditMode);
        $('#my-job').addClass('my-job-edit');
    });

    $('#btn-finish-editing').click(() => {
        isEditMode = false;
        switchButtons(isEditMode);
        $('#my-job').removeClass('my-job-edit');
    });

    fetch("/data.json")
        .then((resp) => resp.json())
        .then((data) => {
            cards = data;
            // TODO подмешать изменения из localStorage
            renderJobCards();
        });
}

init();
