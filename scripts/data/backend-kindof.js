// https://github.com/public-apis/public-apis?tab=readme-ov-file

// HALP could get dog/cat images file to load into buttons from here

/*
const xhr = new XMLHttpRequest();

xhr.addEventListener("load", (e) => {
    // console.log(e.target.response);
    console.log("image url: ", JSON.parse(xhr.response).image);
});

xhr.addEventListener("error", (error) => {
    console.log("Ran into an error", error) ;
})

// xhr.open("GET", "https://dog.ceo/api/breeds/image/random");
xhr.open("GET", "https://foodish-api.com/api/");

xhr.send();
//*/

/*
function useFetchOnDogData() {
    const promise = fetch(
        "https://dog.ceo/api/breeds/image/random"
    ).then((response) => {
        return response.json();
    }).then((returnValue) => {
        console.log(returnValue);
    }).catch((error) => {
        console.log("Ran into an error", error) ;
    });

    return promise;
}

useFetchOnDogData().then(() => {
    console.log("in the then()"); 
});


async function testAsync() {

    try {
        await useFetchOnDogData();
    } catch (error) {
        console.log("Ran into an error", error) ;
    }

    return "value";
}

testAsync().then((value) => {
    console.log(value);
});
//*/


/*
// with xhr
const xhr = new XMLHttpRequest();

xhr.addEventListener("load", () => {
    console.log(xhr.response);
});

xhr.open('GET', "https://foodish-api.com/api/");
xhr.send();
//*/

/*
// with fetch
fetch("https://foodish-api.com/api/")
    .then((response) => {
        response.json()
    .then((json) => {
        console.log(json);
    });
});
//*/

/*
// with aync await
async function fetchFood() {
    const response = await fetch("https://foodish-api.com/api/");
    const json = await response.json();

    console.log(json);
}

fetchFood();
//*/

/*
// POST with async await
async function postGreetings() {
    const response = await fetch("https://supersimplebackend.dev/greeting", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: "My_Name",
        }),
    });

    const greeting = await response.text();

    console.log(greeting);
}

postGreetings();
//*/

/*
async function fetchBezos() {
    const url = "https://amazon.com";
    try {
        const response = await fetch(url);
    } catch (error) {
        console.log(":(", error);
    }
}

fetchBezos();
//*/

/*
// POST with async await but no body 400 error
async function postGreetingsNoBody() {
    try {
        const response = await fetch("https://supersimplebackend.dev/greeting", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    
        if (response.status >= 400) {
            throw response;
        }

        const greeting = await response.text();
        console.log(greeting);
    } catch (error) {
        if (error.status === 400) {
            const errorResponse = await error.json();
            console.log(errorResponse);
        }
        else {
            console.log("Network error");
        }
    }
}

postGreetingsNoBody();
//*/