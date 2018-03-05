const fs = require('fs');
const keypair = require('keypair');
const _ = require('lodash');
const cmd = require('node-cmd');
const path = require('path');
const APP_ROOT = path.dirname(require.main.filename);

let boardOfDirectors = module.exports = (() => {

    const addNewDirector = (params) => {
        return new Promise((resolve, reject) => {
            var nameCamelCase = params.name.replace(' ', '')
            var pair = keypair();
            var filePath = APP_ROOT + '/directors/' + nameCamelCase + '.js'

            var newDirector = {
                name: params.name,
                publicKey: pair.public,
                privateKey: pair.private
            }

            createEntity({
                filePath,
                entity: newDirector,
                nameCamelCase: nameCamelCase,
                entityType: 'directors'
            })
        })
    }

    const addNewStakeholder = (params) => {
        return new Promise((resolve, reject) => {
            var nameCamelCase = params.name.replace(' ', '')
            var filePath = APP_ROOT + '/stakeholders/' + nameCamelCase + '.js'

            var newStakeholder = {
                name: params.name,
                stake: 0
            }

            createEntity({
                filePath,
                entity: newStakeholder,
                nameCamelCase: nameCamelCase,
                entityType: 'stakeholders'
            })
        })
    }

    const addNewWorker = (params) => {
        return new Promise((resolve, reject) => {
            var nameCamelCase = params.name.replace(' ', '')
            var filePath = APP_ROOT + '/workers/' + nameCamelCase + '.js'

            var newWorker = {
                name: params.name,
                proofsOfWork: []
            }

            createEntity({
                filePath,
                entity: newWorker,
                nameCamelCase: nameCamelCase,
                entityType: 'workers'
            })
        })
    }

    const amendIndex = (params) => {
        var indexPath = path.join(APP_ROOT, params.itemType, 'index.js');

        fs.readFile(indexPath, 'utf8', function(err, indexedItems) {
            var newItemIndex = indexedItems.split('return {')[0] + 'return {';
            var afterReturn = indexedItems.split('return {')[1];

            // Matches all strings inside require('') statements
            var rx = /require\(\'.\/\s*(.*?)\s*\'\)/g;
            var items = [];
            var match;

            while ((match = rx.exec(afterReturn)) !== null) {
                items.push(match[1]);
            }

            items.push(params.itemName);
            items.sort();
            items = _.uniq(items);

            items.forEach(function(s, i) {
                newItemIndex += '\n        ' + s + ': require(\'./' + s + '\'),';
            });
            newItemIndex = newItemIndex.substring(0, newItemIndex.length - 1);
            newItemIndex += '\n    };\n})();';

            fs.writeFile(indexPath, newItemIndex);
            console.log(params.itemName + ' has been added to the ' + params.itemType + ' index')
        });
    }

    const createEntity = (params) => {
        var js = 'let ' + params.nameCamelCase + ' = ' + JSON.stringify(params.entity, null, 4)
        js += '\n\nmodule.exports = (() => ' + params.nameCamelCase + ')()'

        fs.writeFile(params.filePath, js, 'utf-8', (err) => {
            if (err) console.log(err)
            else {
                params.itemName = params.nameCamelCase
                params.itemType = params.entityType
                amendIndex(params)
            }
        })
    }

    const getCurrentDirectors = () => {
        return new Promise((resolve, reject) => {
            let directors = require('./directors')
            resolve(Object.keys(directors).map(d => directors[d]))
        })
    }

    return {
        addNewDirector,
        addNewStakeholder,
        addNewWorker,
        getCurrentDirectors
    }
})()


// Module Integration Tests
if (process.env.NODE_ENV == 'production') {
    console.log('Module imported to production: boardOfDirectors')
} else {
    console.log('Running development tests')

    boardOfDirectors.getCurrentDirectors()
    .then(board => {
        console.log(board.map(d => d.name))
    })

    boardOfDirectors.addNewWorker({
        name: 'Oscar Lafarga'
    })
}
