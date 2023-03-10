import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../../Shared/baseUrl';
import MainMenu from '../../Shared/MainMenu';
import { Link } from 'react-router-dom';
import { setAuthHeader } from '../../Redux/token';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { toastOptions } from '../../Shared/toastOptions';
import '../../Components/Breweries/BreweryStyles.css';

function BeerInfo(props) {
    // initialize beer in state (basis is server:Model Beer)
    const emptyBeer = {
        "beerId": 0,
        "breweryId": Number(getBreweryId()),
        "name": "",
        "description": "",
        "imgUrl": "",
        "abv": 0,
        "type": ""
    };

    const [beer, setBeer] = useState(emptyBeer);
    const [breweryName, setBreweryName] = useState("");
    const [validationError, setValidationError] = useState({});
    const [isFormValid, setIsFormValid] = useState(true);
    const [isEditable, setIsEditable] = useState(true);

    // get token and current user from redux store
    const token = useSelector(state => state.token.token);
    const user = useSelector(state => state.user);

    // set auth token in axios header before loading list of beers
    useEffect(() => {
        if (token) {
            setAuthHeader(token);
            getData();
        }
    }, [token]);

    useEffect(() => { getBreweryName() }, [beer]);

    useEffect(() => {
        // check if current user can edit the form
        let editable = false;
        let role = user.authorities[0]
        if (role) {
            if (role.name === "ROLE_ADMIN" ||
                (role.name === "ROLE_BREWER" && user.breweryId === beer.breweryId)) {
                editable = true;
            }
        }
        setIsEditable(editable);
    }, [user, beer])

    async function getData() {
        try {
            // get beer from web api using the query string passed to the page
            let response = { data: emptyBeer };
            // check parameter from search string
            if (window.location.search) {
                // if brewery id is passed then assume that admin or brewer 
                // wants to add a new beer
                if (beer.breweryId === 0) {
                    //get id after ?
                    let id = window.location.search.substring(1);
                    response = await axios.get(baseUrl + "/beers/" + id);
                    setBeer(response.data);
                }
            } else {
                toast.error("Beer id or brewery id required", toastOptions);
            }
        } catch (ex) {
            toast.error(ex.message,toastOptions);
        }
    }

    // update beer in state for each change in every form element
    function handleInputChange(event) {
        event.preventDefault()
        setBeer({
            ...beer,
            [event.target.name]: event.target.value
        });
        setValidationError({ ...validationError, [event.target.name]: validateField(event.target) });
    }

    // validate form
    function formValid() {
        // get list of fields in the form
        let fields = document.getElementById("beerForm").elements;

        //for every field validate and get the error message
        // and save in fieldErrors (eg. fieldErrors.name, fieldErrors.address, etc.)
        let fieldErrors = {}
        Array.from(fields).forEach(field => {
            let error = validateField(field);
            if (error && error.length > 0) fieldErrors = { ...fieldErrors, [field.name]: error };
        })
        let errors = Object.values(fieldErrors);
        let valid = true;
        errors.forEach((error) => {
            if (error && error.length > 0) valid = false;
        });
        setValidationError(fieldErrors);
        setIsFormValid(valid);
        return valid;
    }
    // validate every field in the form
    function validateField(field) {
        let error = "";
        switch (field.name) {
            case "name":
                if (!field.value || field.value.length === 0) error = "Beer Name is required";
                break;
            case "address":
                if (!field.value || field.value.length === 0) error = "Address is required";
                break;
            case "description":
                if (!field.value || field.value.length === 0) error = "Description is required";
                break;
            case "imgUrl":
                if (!field.value || field.value.length === 0) error = "Image is required";
                break;
            case "abv":
                if (!field.value || field.value.length === 0) {
                    error = "ABV is required";
                } else {
                    if (isNaN(field.value) || !isFinite(field.value)) error = "ABV should be numeric";
                }
                break;
            case "type":
                if (!field.value || field.value.length === 0) error = "Type is required";
                break;
        }
        return error;
    }

    async function handleSubmit(event) {
        // TO DO: validate beer information before sending to server
        event.preventDefault();
        if (formValid()) {
            try {
                //save to server
                //if id is zero then create (post) a new beer
                if (beer.beerId === 0) {
                    await axios.post(baseUrl + "/breweries/" + beer.breweryId, beer);
                } else {
                    // else update the existing record
                    await axios.put(baseUrl + "/beers/" + beer.beerId, beer);
                }
                toast.success("Saved successfully", toastOptions);
                // then redirect to list of beers
                window.history.back();

            } catch (ex) {
                toast.error(ex.message, toastOptions);
            }

        } else {
            toast.error("Form has validation errors", toastOptions);
        }
    }
    async function handleDelete(event) {
        event.preventDefault();
        try {
            //delete from server
            //if id is zero then show an error
            if (beer.beerId === 0) {
                toast.error("Beer id is required for delete", toastOptions);
            } else {
                // else update the existing record
                await axios.delete(baseUrl + "/beers/" + beer.beerId);
            }
            toast.success("Beer deleted", toastOptions);
            // then redirect to list of beers
            window.history.back();
        } catch (ex) {
            toast.error(ex.message, toastOptions);
        }
    }

    function getBreweryId() {
        if (window.location.search && window.location.search.indexOf("?breweryId=") >= 0) {
            return window.location.search.substring(11);
        } else {
            return "0";
        }
    }

    function redirectToCaller(event) {
        event.preventDefault();
        window.history.back();
    }

    async function getBreweryName() {
        if (beer.breweryId > 0) {
            let response = await axios.get(baseUrl + "/breweries/" + beer.breweryId);
            setBreweryName(response.data.name);
        }
    }

    // change display based on access
    return (
        <div>
            <MainMenu />
            <div className='admin-edits-container'>
                <div className='#'>
                    <div className='admin-edits-head'><h1>Beer Information</h1></div>
                    <form id="beerForm">
                        <div className="row">
                            <div className='col-8'>
                                <label className="label">Brewery Name</label>
                                <input
                                    type="text"
                                    id="breweryName"
                                    name="breweryName"
                                    className="form-control"
                                    value={breweryName}
                                    readOnly={true}
                                />
                                <label className="label mt-2">Beer Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-control"
                                    placeholder="Beer Name"
                                    v-model="beer.name"
                                    onChange={handleInputChange}
                                    value={beer.name}
                                    readOnly={beer.beerId !== 0}
                                    maxLength={50}
                                />
                                {(!isFormValid && validationError.name && validationError.name.length > 0) ?
                                    <div className="text-danger small ms-2">{validationError.name}</div> : null
                                }
                                <label className="label mt-2">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    className="form-control"
                                    placeholder="Description"
                                    v-model="beer.description"
                                    onChange={handleInputChange}
                                    value={beer.description}
                                    rows="4"
                                    required
                                    maxLength={1000}
                                    readOnly={!isEditable}
                                />
                                {(!isFormValid && validationError.description && validationError.description.length > 0) ?
                                    <div className="text-danger small ms-2">{validationError.description}</div> : null
                                }
                                <label className="label mt-2">Image</label>
                                <input
                                    type="text"
                                    id="imgUrl"
                                    name="imgUrl"
                                    className="form-control"
                                    placeholder="Image Url"
                                    v-model="beer.imgUrl"
                                    onChange={handleInputChange}
                                    value={beer.imgUrl}
                                    required
                                    maxLength={255}
                                    readOnly={!isEditable}

                                />
                                {(!isFormValid && validationError.imgUrl && validationError.imgUrl.length > 0) ?
                                    <div className="text-danger small ms-2">{validationError.imgUrl}</div> : null
                                }
                                <label className="label mt-2">Alcohol by Volume (ABV)</label>
                                <input
                                    type="text"
                                    id="abv"
                                    name="abv"
                                    className="form-control"
                                    placeholder="ABV"
                                    v-model="beer.abv"
                                    onChange={handleInputChange}
                                    value={beer.abv}
                                    required
                                    maxLength={6}
                                    readOnly={!isEditable}
                                />
                                {(!isFormValid && validationError.abv && validationError.abv.length > 0) ?
                                    <div className="text-danger small ms-2">{validationError.abv}</div> : null
                                }
                                <label className="label mt-2">Type</label>
                                <input
                                    type="text"
                                    id="type"
                                    name="type"
                                    className="form-control"
                                    placeholder="Type"
                                    v-model="beer.type"
                                    onChange={handleInputChange}
                                    value={beer.type}
                                    required
                                    maxLength={50}
                                    readOnly={!isEditable}
                                />
                                {(!isFormValid && validationError.type && validationError.type.length > 0) ?
                                    <div className="text-danger small ms-2">{validationError.type}</div> : null
                                }
                            </div>
                            <div className='col'>
                                <div>
                                    <img className="img-fluid img-brewery-details rounded" src={beer.imgUrl} />
                                </div>
                            </div>
                        </div>
                        <div className="buttonContainer mt-3">
                            {isEditable ?
                                (
                                    <div>
                                        <button className="btn btn-primary" type="submit" onClick={handleSubmit}>Save</button>
                                    </div>
                                ) : null
                            }
                            <div>
                                <button className="btn btn-primary" type="cancel" onClick={redirectToCaller}>Cancel</button>
                            </div>
                            {isEditable && beer.beerId > 0 ? (
                                <div className='ms-3'>
                                    <button className="btn btn-primary" type="button" onClick={handleDelete}>Delete</button>
                                </div>
                            ) : null}
                            {beer.beerId > 0 ? (
                                <div>
                                    <Link to={"/review-info?beerId=" + beer.beerId}><button className="btn btn-primary ms-2" type="button">Add Review</button></Link>
                                    <Link to={"/reviews?beerId=" + beer.beerId}><button className="btn btn-primary ms-2" type="button" >View Reviews</button></Link>
                                </div>
                            ) : null}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default BeerInfo;