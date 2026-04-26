def test_signup_adds_student_to_activity(client):
    email = "newstudent@mergington.edu"

    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}

    refreshed = client.get("/activities").json()
    assert email in refreshed["Chess Club"]["participants"]


def test_signup_rejects_duplicate_student(client):
    existing_email = "michael@mergington.edu"

    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": existing_email},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}


def test_signup_rejects_unknown_activity(client):
    response = client.post(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}
