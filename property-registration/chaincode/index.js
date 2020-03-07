'use strict';
//Module for Users Organization
const propregusercontract = require('./user-contract.js');

//Module for Registrar Organization
const propregregistrarcontract = require('./registrar-contract.js');

//Export the contracts
module.exports.contracts = [propregusercontract, propregregistrarcontract];
