def test_unregister_removes_student_from_activity(client):
    existing_email = "michael@mergington.edu"

    response = client.delete(
        "/activities/Chess%20Club/signup",
        params={"email": existing_email},
    )

    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {existing_email} from Chess Club"}

    refreshed = client.get("/activities").json()
    assert existing_email not in refreshed["Chess Club"]["participants"]


def test_unregister_rejects_non_participant(client):
    response = client.delete(
        "/activities/Chess%20Club/signup",
        params={"email": "not-enrolled@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Participant not found"}


def test_unregister_rejects_unknown_activity(client):
    response = client.delete(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}
